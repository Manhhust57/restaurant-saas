import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { pizzaAbcMenu } from './pizza-abc-menu';
import { pizzaAbcImages } from './pizza-abc-images';

const prisma = new PrismaClient();
const targetId = 'cmu2sd18400002rpols0khip6';

async function main() {
    const apply = process.argv.includes('--apply');
    const result = await prisma.$transaction(async tx => {
        const tenant = await tx.tenant.findUnique({ where: { slug: 'pizza-abc' } });
        if (!tenant || tenant.id !== targetId || tenant.name !== 'Pizza ABC') {
            throw new Error('Target tenant does not match the inspected Pizza ABC restaurant.');
        }
        const tenantId = tenant.id;
        const foreignReferences = await tx.orderItem.count({
            where: { product: { tenantId }, order: { tenantId: { not: tenantId } } },
        });
        const foreignProducts = await tx.product.count({
            where: { category: { tenantId }, tenantId: { not: tenantId } },
        });
        if (foreignReferences || foreignProducts) throw new Error('Cross-tenant references detected; reset cancelled.');

        const before = {
            payments: await tx.payment.count({ where: { order: { tenantId } } }),
            orderItems: await tx.orderItem.count({ where: { order: { tenantId } } }),
            orders: await tx.order.count({ where: { tenantId } }),
            products: await tx.product.count({ where: { tenantId } }),
            categories: await tx.category.count({ where: { tenantId } }),
        };
        if (!apply) return { mode: 'preview', tenant: { id: tenantId, name: tenant.name }, before,
            planned: { categories: pizzaAbcMenu.length, products: pizzaAbcMenu.reduce((n, c) => n + c.products.length, 0) } };

        await tx.payment.deleteMany({ where: { order: { tenantId } } });
        await tx.orderItem.deleteMany({ where: { order: { tenantId } } });
        await tx.order.deleteMany({ where: { tenantId } });
        await tx.product.deleteMany({ where: { tenantId } });
        await tx.category.deleteMany({ where: { tenantId } });

        for (const [index, category] of pizzaAbcMenu.entries()) {
            const created = await tx.category.create({ data: { tenantId, name: category.name, sortOrder: index + 1, isActive: true } });
            await tx.product.createMany({ data: category.products.map(product => ({
                ...product, tenantId, categoryId: created.id, imageUrl: pizzaAbcImages[product.name] ?? null, isActive: true,
            })) });
        }
        const after = {
            orders: await tx.order.count({ where: { tenantId } }),
            products: await tx.product.count({ where: { tenantId } }),
            categories: await tx.category.count({ where: { tenantId } }),
        };
        if (after.orders !== 0 || after.products !== 21 || after.categories !== 6) throw new Error('Unexpected seed counts; rolling back.');
        return { mode: 'applied', tenant: { id: tenantId, name: tenant.name }, removed: before, after };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
    console.log(JSON.stringify(result, null, 2));
}

main().catch(error => {
    console.error(error instanceof Prisma.PrismaClientKnownRequestError ? error.code : error.message);
    process.exitCode = 1;
}).finally(() => prisma.$disconnect());
