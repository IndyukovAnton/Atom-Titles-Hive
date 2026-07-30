import { IsOptional, IsUrl } from 'class-validator';

export class DownloadCoverDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  thumbnail?: string;
}
