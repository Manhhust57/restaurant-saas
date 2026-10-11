import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { pizzaAbcImages } from './pizza-abc-images';

const prisma = new PrismaClient();
async function main() {
    if (process.argv.includes('--check-links')) {
        const entries = Object.entries(pizzaAbcImages);
        for (let i = 0; i < entries.length; i += 3) {
            await Promise.all(entries.slice(i, i + 3).map(async ([name, url]) => {
                try {
                    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
                    console.log(JSON.stringify({ name, status: response.status, type: response.headers.get('content-type') }));
                } catch { console.log(JSON.stringify({ name, status: 'unreachable' })); }
            }));
        }
        return;
    }
    await prisma.$transaction(async tx => {
        const tenant = await tx.tenant.findUnique({ where: { slug: 'pizza-abc' } });
        if (!tenant || tenant.id !== 'cmu2sd18400002rpols0khip6') throw new Error('Unexpected tenant');
        const products = await tx.product.findMany({ where: { tenantId: tenant.id }, select: { id: true, name: true, imageUrl: true } });
        for (const name of Object.keys(pizzaAbcImages)) {
            if (products.filter(p => p.name === name).length !== 1) throw new Error(`Missing or duplicate product: ${name}`);
        }
        if (!process.argv.includes('--apply')) {
            console.log(JSON.stringify({ tenant: tenant.name, matched: Object.keys(pizzaAbcImages).length, mode: 'preview' }));
            return;
        }
        for (const [name, imageUrl] of Object.entries(pizzaAbcImages)) {
            const product = products.find(p => p.name === name)!;
            await tx.product.update({ where: { id: product.id, tenantId: tenant.id }, data: { imageUrl } });
        }
        console.log(JSON.stringify({ tenant: tenant.name, updated: Object.keys(pizzaAbcImages).length }));
    }, { timeout: 30000 });
}
main().catch(error => { console.error(error.code || error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
