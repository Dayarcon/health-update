import { IsString, IsOptional, IsInt, MinLength, MaxLength, Min, Max, IsIn } from 'class-validator';

const GENDERS = ['male', 'female', 'other'];
const RELATIONS = ['self', 'parent', 'spouse', 'child', 'other'];

export class CreatePatientDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  age?: number;

  @IsOptional()
  @IsIn(GENDERS)
  gender?: string;

  @IsOptional()
  @IsIn(RELATIONS)
  relation?: string;
}
