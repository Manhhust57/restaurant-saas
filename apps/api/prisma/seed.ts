import { PrismaClient, MembershipRole, TenantStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { pizzaAbcMenu } from './pizza-abc-menu';
import { pizzaAbcImages } from './pizza-abc-images';

const prisma = new PrismaClient();

async function main() {
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'pizza-abc' },
        update: {},
        create: {
            name: 'Pizza ABC',
            slug: 'pizza-abc',
            status: TenantStatus.ACTIVE,
        },
    });

    const branch = await prisma.branch.upsert({
        where: {
            tenantId_code: {
                tenantId: tenant.id,
                code: 'CG-01',
            },
        },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'Chi nhánh Cầu Giấy',
            code: 'CG-01',
            address: 'Cầu Giấy, Hà Nội',
        },
    });

    const user = await prisma.user.upsert({
        where: { email: 'owner@pizzaabc.vn' },
        update: {},
        create: {
            email: 'owner@pizzaabc.vn',
            passwordHash: await bcrypt.hash('123456', 10),
            fullName: 'Quản lý Pizza ABC',
        },
    });

    await prisma.membership.upsert({
        where: {
            userId_tenantId: {
                userId: user.id,
                tenantId: tenant.id,
            },
        },
        update: {},
        create: {
            userId: user.id,
            tenantId: tenant.id,
            role: MembershipRole.OWNER,
        },
    });

    // Menu chuẩn = pizza-abc-menu.ts. Không tạo nhóm demo Pizza/Nước uống/Món phụ.
    const existingCategories = await prisma.category.count({ where: { tenantId: tenant.id } });
    if (existingCategories === 0) {
        for (const [index, category] of pizzaAbcMenu.entries()) {
            const created = await prisma.category.create({
                data: {
                    tenantId: tenant.id,
                    name: category.name,
                    sortOrder: index + 1,
                    isActive: true,
                },
            });
            await prisma.product.createMany({
                data: category.products.map((product) => ({
                    tenantId: tenant.id,
                    categoryId: created.id,
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    imageUrl: pizzaAbcImages[product.name] ?? null,
                    isActive: true,
                })),
            });
        }
        console.log(`Seeded menu from pizza-abc-menu.ts (${pizzaAbcMenu.length} categories)`);
    } else {
        console.log(`Menu already present (${existingCategories} categories); skipped menu seed`);
    }

    await prisma.table.createMany({
        data: [
            { tenantId: tenant.id, branchId: branch.id, name: 'Bàn 1', code: 'T1', qrToken: 'qr-b1', capacity: 2, status: 'AVAILABLE' },
            { tenantId: tenant.id, branchId: branch.id, name: 'Bàn 2', code: 'T2', qrToken: 'qr-b2', capacity: 4, status: 'AVAILABLE' },
            { tenantId: tenant.id, branchId: branch.id, name: 'Bàn 3', code: 'T3', qrToken: 'qr-b3', capacity: 6, status: 'AVAILABLE' },
        ],
        skipDuplicates: true,
    });

    console.log('Seed data created');
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
