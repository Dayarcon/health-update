import { IsString, IsEmail, IsOptional, IsEnum, MinLength } from 'class-validator';

enum CaregiverRelation {
  PARENT = 'parent',
  SPOUSE = 'spouse',
  SIBLING = 'sibling',
  CHILD = 'child',
  FRIEND = 'friend',
  OTHER = 'other',
}

export class CreateCaregiverDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(CaregiverRelation)
  relation!: CaregiverRelation;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  expoToken?: string;

  @IsOptional()
  @IsString()
  telegramId?: string;
}
