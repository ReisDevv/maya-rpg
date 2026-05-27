import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // Matches image/jpeg, image/png, video/mp4, video/webm, video/quicktime
  private static readonly ALLOWED_MIME = /^(image\/(jpeg|png)|video\/(mp4|webm|quicktime))$/;

  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

  @Post()
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: UploadController.MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: UploadController.ALLOWED_MIME }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.buildFileResponse(file);
  }

  @Post('multiple')
  @Roles(UserRole.PROFESSIONAL, UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    const invalid = files.find((f) => !UploadController.ALLOWED_MIME.test(f.mimetype));
    if (invalid) {
      throw new BadRequestException(`Tipo de arquivo inválido: ${invalid.originalname}`);
    }

    const oversized = files.find((f) => f.size > UploadController.MAX_FILE_SIZE);
    if (oversized) {
      throw new BadRequestException(`Arquivo muito grande: ${oversized.originalname}`);
    }

    return { files: files.map((f) => this.buildFileResponse(f)) };
  }

  private buildFileResponse(file: Express.Multer.File) {
    return {
      url: this.uploadService.generateFileUrl(file.filename),
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    };
  }
}
