import { IsIn, IsString, Matches } from 'class-validator';

export class AddMediaFileDto {
  // Фронт отправляет либо внешнюю http(s)-ссылку, либо data: URL
  // с base64-содержимым (FileReader) — оба варианта легитимны.
  @IsString()
  @Matches(/^(https?:\/\/|data:(image|video)\/)/, {
    message: 'url must be an http(s) link or an image/video data URL',
  })
  url: string;

  @IsIn(['image', 'video'])
  type: 'image' | 'video';
}
