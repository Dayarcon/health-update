import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CaregiversService } from './caregivers.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('caregivers')
@UseGuards(JwtAuthGuard)
export class CaregiversController {
  constructor(private caregivers: CaregiversService) {}

  // ============================================================================
  // PATIENT ENDPOINTS
  // ============================================================================

  // POST /caregivers/invite - Invite a caregiver
  @Post('invite')
  async inviteCaregiver(
    @CurrentUser() user: any,
    @Body() body: { email: string; relationship: string },
  ) {
    return this.caregivers.inviteCaregiver(
      user.id,
      body.email,
      body.relationship,
    );
  }

  // GET /caregivers/my-caregivers - Get patient's caregivers
  @Get('my-caregivers')
  async getMyCaregivers(@CurrentUser() user: any) {
    return this.caregivers.getPatientCaregivers(user.id);
  }

  // DELETE /caregivers/:id - Remove caregiver
  @Delete(':id')
  async removeCaregiver(
    @CurrentUser() user: any,
    @Param('id') caregiverRelationId: string,
  ) {
    return this.caregivers.removeCaregiver(user.id, caregiverRelationId);
  }

  // PATCH /caregivers/:id/permissions - Update caregiver permissions
  @Patch(':id/permissions')
  async updatePermissions(
    @CurrentUser() user: any,
    @Param('id') caregiverRelationId: string,
    @Body() body: any,
  ) {
    return this.caregivers.updateCaregiverPermissions(
      user.id,
      caregiverRelationId,
      body.permissions,
    );
  }

  // ============================================================================
  // CAREGIVER ENDPOINTS
  // ============================================================================

  // POST /caregivers/accept-invitation - Accept invitation
  @Post('accept-invitation')
  async acceptInvitation(
    @CurrentUser() user: any,
    @Body() body: { invitationCode: string },
  ) {
    return this.caregivers.acceptInvitation(user.id, body.invitationCode);
  }

  // GET /caregivers/my-patients - Get caregiver's patients
  @Get('my-patients')
  async getMyPatients(@CurrentUser() user: any) {
    return this.caregivers.getCaregiverPatients(user.id);
  }

  // GET /caregivers/patients/:patientId/reports - Get patient's reports
  @Get('patients/:patientId/reports')
  async getPatientReports(
    @CurrentUser() user: any,
    @Param('patientId') patientId: string,
  ) {
    return this.caregivers.getPatientReportsAsCaregiver(user.id, patientId);
  }
}
