import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsBoolean } from "class-validator";

export class ImportProductsDto {
  @ApiProperty({ type: "string", format: "binary" })
  file: Express.Multer.File;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  updateExisting?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultCategoryId?: string;
}

export class ExportProductsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeVariations?: boolean;

  @ApiPropertyOptional({ enum: ["xlsx", "csv"] })
  @IsOptional()
  @IsString()
  format?: "xlsx" | "csv";
}

export class LinkVariationDto {
  @ApiProperty()
  @IsString()
  parentProductId: string;

  @ApiProperty({ type: [String] })
  variationIds: string[];
}

export class UnlinkVariationDto {
  @ApiProperty({ type: [String] })
  variationIds: string[];
}
