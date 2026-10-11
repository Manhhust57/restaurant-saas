import { BadGatewayException, BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export type ProductImageFile = { buffer: Buffer; mimetype: string; size: number };

@Injectable()
export class ProductImagesService {
    constructor(private readonly config: ConfigService) {}

    async upload(tenantId: string, file?: ProductImageFile): Promise<{ imageUrl: string }> {
        if (!file?.buffer?.length) throw new BadRequestException('Vui lòng chọn ảnh.');
        if (file.buffer.length > 5 * 1024 * 1024) throw new BadRequestException('Ảnh tối đa 5 MB.');
        const bytes = file.buffer;
        const jpeg = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
        const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        const webp = bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
        if (!(jpeg && file.mimetype === 'image/jpeg') && !(png && file.mimetype === 'image/png') && !(webp && file.mimetype === 'image/webp')) {
            throw new BadRequestException('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.');
        }

        let credentials: URL;
        try {
            credentials = new URL(this.config.get<string>('CLOUDINARY_URL') ?? '');
            if (credentials.protocol !== 'cloudinary:' || !credentials.username || !credentials.password || !credentials.hostname) throw new Error();
        } catch {
            throw new ServiceUnavailableException('Chưa cấu hình dịch vụ upload ảnh.');
        }

        return new Promise((resolve, reject) => {
            const fail = () => reject(new BadGatewayException('Không upload được ảnh. Vui lòng thử lại.'));
            try {
                const stream = cloudinary.uploader.upload_stream({
                    cloud_name: credentials.hostname,
                    api_key: decodeURIComponent(credentials.username),
                    api_secret: decodeURIComponent(credentials.password),
                    resource_type: 'image',
                    allowed_formats: ['jpg', 'png', 'webp'],
                    folder: `restaurants/${tenantId}/products`,
                    timeout: 60000,
                }, (error, result) => {
                    if (error || !result?.secure_url) return fail();
                    resolve({ imageUrl: result.secure_url });
                });
                stream.on('error', fail);
                stream.end(bytes);
            } catch { fail(); }
        });
    }
}
