import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { randomBytes } from 'crypto';

@Injectable()
export class CaregiversService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Generate unique invitation code
  generateInvitationCode(): string {
    return randomBytes(6).toString('hex').toUpperCase();
  }

  // PATIENT: Invite a caregiver
  async inviteCaregiver(
    patientUserId: string,
    caregiverEmail: string,
    relationship: string,
  ) {
    // Get patient's own patient record
    const patient = await this.prisma.patient.findFirst({
      where: { userId: patientUserId },
    });

    if (!patient) {
      throw new BadRequestException('Patient profile not found');
    }

    // Check if caregiver exists in system
    let caregiver = await this.prisma.user.findUnique({
      where: { email: caregiverEmail },
    });

    if (!caregiver) {
      // Create new caregiver user if doesn't exist
      caregiver = await this.prisma.user.create({
        data: {
          email: caregiverEmail,
          role: 'caregiver',
          name: caregiverEmail.split('@')[0],
        },
      });
    }

    // Check if relationship already exists
    const existing = await this.prisma.patientCaregiver.findUnique({
      where: {
        patientId_caregiverId: {
          patientId: patient.id,
          caregiverId: caregiver.id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Caregiver already invited');
    }

    // Create invitation
    const invitationCode = this.generateInvitationCode();
    const relation = await this.prisma.patientCaregiver.create({
      data: {
        patientId: patient.id,
        caregiverId: caregiver.id,
        relationship,
        invitationCode,
        isAccepted: false,
        canViewReports: true,
        canViewLocation: false,
        canMessage: true,
      },
      include: {
        patient: true,
        caregiver: true,
      },
    });

    // Send notification
    await this.notifications.notifyNewInvitation(
      caregiver.id,
      patient.name,
      invitationCode,
    );

    return {
      success: true,
      data: {
        invitationCode: relation.invitationCode,
        message: `Invitation sent to ${caregiverEmail}`,
      },
    };
  }

  // CAREGIVER: Accept invitation
  async acceptInvitation(caregiverId: string, invitationCode: string) {
    const relation = await this.prisma.patientCaregiver.findUnique({
      where: { invitationCode },
    });

    if (!relation) {
      throw new BadRequestException('Invalid invitation code');
    }

    if (relation.caregiverId !== caregiverId) {
      throw new ForbiddenException('This invitation is not for you');
    }

    // Accept the invitation
    const updated = await this.prisma.patientCaregiver.update({
      where: { id: relation.id },
      data: { isAccepted: true },
      include: {
        patient: { include: { user: true } },
        caregiver: true,
      },
    });

    // Notify patient
    await this.notifications.notifyInvitationAccepted(
      updated.patient.userId,
      updated.caregiver.name || 'A caregiver',
      updated.patient.name,
    );

    return {
      success: true,
      data: {
        patientId: updated.patient.id,
        patientName: updated.patient.name,
        relationship: updated.relationship,
      },
    };
  }

  // PATIENT: Get my caregivers
  async getPatientCaregivers(patientUserId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { userId: patientUserId },
    });

    if (!patient) {
      throw new BadRequestException('Patient profile not found');
    }

    const caregivers = await this.prisma.patientCaregiver.findMany({
      where: { patientId: patient.id },
      include: {
        caregiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: caregivers.map((c) => ({
        id: c.id,
        caregiverId: c.caregiver.id,
        name: c.caregiver.name,
        email: c.caregiver.email,
        relationship: c.relationship,
        status: c.isAccepted ? 'active' : 'pending',
        permissions: {
          canViewReports: c.canViewReports,
          canViewLocation: c.canViewLocation,
          canMessage: c.canMessage,
          canInviteOthers: c.canInviteOthers,
        },
      })),
    };
  }

  // PATIENT: Remove caregiver
  async removeCaregiver(patientUserId: string, caregiverRelationId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { userId: patientUserId },
    });

    if (!patient) {
      throw new BadRequestException('Patient profile not found');
    }

    const relation = await this.prisma.patientCaregiver.findUnique({
      where: { id: caregiverRelationId },
    });

    if (!relation || relation.patientId !== patient.id) {
      throw new ForbiddenException('Cannot remove this caregiver');
    }

    await this.prisma.patientCaregiver.delete({
      where: { id: caregiverRelationId },
    });

    return { success: true, message: 'Caregiver removed' };
  }

  // CAREGIVER: Get my patients
  async getCaregiverPatients(caregiverId: string) {
    const relations = await this.prisma.patientCaregiver.findMany({
      where: {
        caregiverId,
        isAccepted: true,
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            _count: {
              select: { reports: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: relations.map((r) => ({
        patientId: r.patient.id,
        name: r.patient.name || r.patient.user.name,
        email: r.patient.user.email,
        age: r.patient.age,
        relationship: r.relationship,
        totalReports: r.patient._count.reports,
        permissions: {
          canViewReports: r.canViewReports,
          canViewLocation: r.canViewLocation,
          canMessage: r.canMessage,
        },
      })),
    };
  }

  // CAREGIVER: Get patient's reports (only if has access)
  async getPatientReportsAsCaregiver(
    caregiverId: string,
    patientId: string,
  ) {
    // Check if caregiver has access to this patient
    const relation = await this.prisma.patientCaregiver.findUnique({
      where: {
        patientId_caregiverId: {
          patientId,
          caregiverId,
        },
      },
    });

    if (!relation || !relation.isAccepted || !relation.canViewReports) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const reports = await this.prisma.report.findMany({
      where: {
        patientId,
        visibility: { in: ['shared-with-caregivers', 'public'] },
      },
      include: {
        medicines: true,
        diagnoses: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: reports,
    };
  }

  // PATIENT: Update caregiver permissions
  async updateCaregiverPermissions(
    patientUserId: string,
    caregiverRelationId: string,
    permissions: {
      canViewLocation?: boolean;
      canViewReports?: boolean;
      canMessage?: boolean;
      canInviteOthers?: boolean;
    },
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: { userId: patientUserId },
    });

    if (!patient) {
      throw new BadRequestException('Patient profile not found');
    }

    const relation = await this.prisma.patientCaregiver.findUnique({
      where: { id: caregiverRelationId },
    });

    if (!relation || relation.patientId !== patient.id) {
      throw new ForbiddenException('Cannot update this caregiver');
    }

    const updated = await this.prisma.patientCaregiver.update({
      where: { id: caregiverRelationId },
      data: permissions,
      include: { caregiver: true },
    });

    return {
      success: true,
      data: {
        caregiverId: updated.caregiver.id,
        permissions: {
          canViewLocation: updated.canViewLocation,
          canViewReports: updated.canViewReports,
          canMessage: updated.canMessage,
          canInviteOthers: updated.canInviteOthers,
        },
      },
    };
  }
}
