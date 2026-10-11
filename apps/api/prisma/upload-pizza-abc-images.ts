import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { createHash } from 'node:crypto';
import { pizzaAbcImages } from './pizza-abc-images';

const prisma = new PrismaClient();
async function main() {
    const credentials = new URL(process.env.CLOUDINARY_URL ?? '');
    if (credentials.protocol !== 'cloudinary:' || !credentials.username || !credentials.password) throw new Error('Missing Cloudinary configuration');
    cloudinary.config({ cloud_name: credentials.hostname, api_key: decodeURIComponent(credentials.username), api_secret: decodeURIComponent(credentials.password), secure: true });
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'pizza-abc' } });
    if (!tenant || tenant.id !== 'cmu2sd18400002rpols0khip6') throw new Error('Unexpected tenant');
    const products = await prisma.product.findMany({ where: { tenantId: tenant.id } });
    for (const name of Object.keys(pizzaAbcImages)) {
        if (products.filter(p => p.name === name).length !== 1) throw new Error('Menu names do not match');
    }
    let succeeded = 0;
    const failed: string[] = [];
    for (const [name, source] of Object.entries(pizzaAbcImages)) {
        const product = products.find(p => p.name === name)!;
        if (product.imageUrl?.startsWith(`https://res.cloudinary.com/${credentials.hostname}/`)) {
            succeeded++;
            console.log(JSON.stringify({ name, status: 'already-uploaded', imageUrl: product.imageUrl }));
            continue;
        }
        if (product.imageUrl !== source) throw new Error('Image changed since mapping; stopping to avoid overwriting');
        const candidates = [source];
        if (source.startsWith('https://commons.wikimedia.org/wiki/Special:Redirect/file/')) {
            const filename = decodeURIComponent(source.split('/file/')[1]).replace(/ /g, '_');
            const hash = createHash('md5').update(filename).digest('hex');
            candidates.unshift(`https://upload.wikimedia.org/wikipedia/commons/${hash[0]}/${hash.slice(0, 2)}/${encodeURIComponent(filename)}`);
        }
        let imageUrl: string | undefined;
        for (const url of candidates) {
            try {
                const result = await cloudinary.uploader.upload(url, {
                    resource_type: 'image', folder: `restaurants/${tenant.id}/products`,
                    public_id: `seed-${product.id}`, overwrite: false, timeout: 25000,
                });
                imageUrl = result.secure_url;
                break;
            } catch (error) {
                const status = (error as { http_code?: number }).http_code;
                console.log(JSON.stringify({ name, attempt: candidates.indexOf(url) + 1, status: 'upload-failed', code: status ?? 'network' }));
            }
        }
        if (!imageUrl) { failed.push(name); continue; }
        const updated = await prisma.product.updateMany({ where: { id: product.id, tenantId: tenant.id, imageUrl: source }, data: { imageUrl } });
        if (updated.count !== 1) throw new Error('Image changed during upload; database update skipped');
        succeeded++;
        console.log(JSON.stringify({ name, status: 'uploaded', imageUrl }));
    }
    console.log(JSON.stringify({ succeeded, failed }));
}
main().catch(() => { console.error('Migration stopped. Check configuration and current menu; secrets omitted.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
