import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface MedicalExtraction {
  patientName: string | null;
  diagnosis: string[];
  medicines: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }>;
  tests: Record<string, string>;
  doctorNotes: string | null;
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  rawText: string;
}

@Injectable()
export class GeminiService {
  private client: GoogleGenerativeAI;
  private model: any;
  private logger = new Logger(GeminiService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });
  }

  async extractMedicalData(
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<MedicalExtraction> {
    try {
      const base64Data = fileBuffer.toString('base64');

      const systemPrompt = `You are a medical document extraction assistant. Analyse the provided medical document and extract information in the exact JSON format specified. Be thorough and accurate. If a field is not found in the document, set it to null or an empty array as appropriate.`;

      const userPrompt = `Extract medical information from this document and return ONLY a valid JSON object with this exact structure:
{
  "patientName": "string or null",
  "diagnosis": ["condition1", "condition2"],
  "medicines": [{"name": "medicine name", "dosage": "dosage like 5mg", "frequency": "once daily", "duration": "7 days"}],
  "tests": {"test name": "result"},
  "doctorNotes": "any doctor notes or null",
  "riskLevel": "low" or "medium" or "high",
  "summary": "2-3 sentence plain language explanation",
  "rawText": "full text extracted from the document"
}

Important: Return ONLY the JSON object, no markdown formatting, no explanations.`;

      const response = await this.model.generateContent([
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        {
          text: `${systemPrompt}\n\n${userPrompt}`,
        },
      ]);

      const responseText = response.response.text();

      const extraction = this.parseJsonResponse(responseText);
      return this.validateExtraction(extraction);
    } catch (error: any) {
      this.logger.error(`Gemini extraction failed: ${error?.message}`);
      throw new InternalServerErrorException({
        success: false,
        error: {
          code: 'OCR_FAILED',
          message: `Failed to extract medical data: ${error?.message || 'Unknown error'}`,
        },
      });
    }
  }

  private parseJsonResponse(text: string): any {
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

    try {
      return JSON.parse(cleanedText);
    } catch (error) {
      throw new Error(`Failed to parse Gemini response as JSON: ${text.substring(0, 200)}`);
    }
  }

  private validateExtraction(data: any): MedicalExtraction {
    const defaultExtraction: MedicalExtraction = {
      patientName: data?.patientName || null,
      diagnosis: Array.isArray(data?.diagnosis) ? data.diagnosis : [],
      medicines: Array.isArray(data?.medicines)
        ? data.medicines.map((m: any) => ({
            name: m.name || 'Unknown',
            dosage: m.dosage || undefined,
            frequency: m.frequency || undefined,
            duration: m.duration || undefined,
          }))
        : [],
      tests: typeof data?.tests === 'object' && data.tests !== null ? data.tests : {},
      doctorNotes: data?.doctorNotes || null,
      riskLevel: ['low', 'medium', 'high'].includes(data?.riskLevel)
        ? data.riskLevel
        : 'low',
      summary: data?.summary || 'No summary available',
      rawText: data?.rawText || 'No text extracted',
    };

    return defaultExtraction;
  }
}
