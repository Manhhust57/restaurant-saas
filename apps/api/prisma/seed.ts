import { PrismaClient, MembershipRole, TenantStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

    const category = await prisma.category.createMany({
        data: [
            { tenantId: tenant.id, name: 'Pizza', sortOrder: 1, isActive: true },
            { tenantId: tenant.id, name: 'Nước uống', sortOrder: 2, isActive: true },
            { tenantId: tenant.id, name: 'Món phụ', sortOrder: 3, isActive: true },
        ],
        skipDuplicates: true,
    });

    const categoryList = await prisma.category.findMany({ where: { tenantId: tenant.id } });

    await prisma.product.createMany({
        data: [
            {
                tenantId: tenant.id,
                categoryId: categoryList[0]?.id ?? '',
                name: 'Pizza Margherita',
                description: 'Pizza truyền thống',
                price: 190000,
                imageUrl: null,
                isActive: true,
            },
            {
                tenantId: tenant.id,
                categoryId: categoryList[0]?.id ?? '',
                name: 'Pizza Hải Sản',
                description: 'Pizza hải sản tươi',
                price: 230000,
                imageUrl: null,
                isActive: true,
            },
            {
                tenantId: tenant.id,
                categoryId: categoryList[1]?.id ?? '',
                name: 'Coca Cola',
                description: 'Nước ngọt lon 330ml',
                price: 25000,
                imageUrl: null,
                isActive: true,
            },
        ],
        skipDuplicates: false,
    });

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
