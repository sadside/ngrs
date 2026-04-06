import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  // Admin user
  const admin = await prisma.user.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      login: 'admin',
      password,
      fullName: 'Низамов В.О.',
      phone: '+79001234567',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Logist user
  const logist = await prisma.user.upsert({
    where: { login: 'logist' },
    update: {},
    create: {
      login: 'logist',
      password: await bcrypt.hash('logist123', 10),
      fullName: 'Логист Тестовый',
      phone: '+79001234568',
      role: 'LOGIST',
      status: 'ACTIVE',
    },
  });

  // Driver user
  const driver = await prisma.user.upsert({
    where: { login: 'shvedkin' },
    update: {},
    create: {
      login: 'shvedkin',
      password: await bcrypt.hash('driver123', 10),
      fullName: 'Шведкин О.Ю.',
      phone: '+79001234569',
      role: 'DRIVER',
      status: 'ACTIVE',
    },
  });

  // Cargo
  const cargo = await prisma.cargo.create({
    data: {
      name: 'Конденсат газовый смесевой',
      technicalSpec: 'ТУ 19.20.32-001-20484253-2018',
      unCode: 'UN 3295',
      hazardClass: '3',
      packagingMethod: 'наливом',
    },
  });

  // Vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      brand: 'СКАНИЯ',
      model: 'R440',
      licensePlate: 'Е063НМ156',
      trailerPlate: 'ВК861256',
      ownershipType: 'GRATUITOUS',
      assignedDriverId: driver.id,
      allowedCargos: { create: [{ cargoId: cargo.id }] },
    },
  });

  // Contractors
  const sender = await prisma.contractor.create({
    data: {
      name: 'ООО "Интерком"',
      inn: '5609182980',
      legalAddress: 'Оренбург, ул. Мало-Луговая, 3/1, оф. 507',
      type: 'SENDER',
    },
  });

  const receiver = await prisma.contractor.create({
    data: {
      name: 'ООО "ОЙЛ ГРУПП"',
      inn: '5611081141',
      legalAddress: 'Оренбург, мкр Ростоши, ул. Дальнереченская, д. 8А, кв. 38',
      type: 'RECEIVER',
    },
  });

  await prisma.contractor.create({
    data: {
      name: 'ООО "Триумф"',
      inn: '5640021583',
      legalAddress: 'Оренбургская область, Переволоцкий район, п. Переволоцкий, ул. Промышленная, д.4',
      type: 'BOTH',
    },
  });

  // Route
  const route = await prisma.route.create({
    data: {
      senderContractorId: sender.id,
      receiverContractorId: receiver.id,
      loadingAddress: 'Оренбургская обл., Переволоцкий район, п. Переволоцкий, ул. Северная, д. 1А',
      unloadingAddress: 'Оренбургский район, с/с Подгородне-Покровский, 26 км автодороги "Оренбург-Самара"',
      description: 'Триумф → ОЙЛ ГРУПП (Переволоцкий → Подгородне-Покровский)',
    },
  });

  console.log('Seed complete:', { admin: admin.id, logist: logist.id, driver: driver.id, cargo: cargo.id, vehicle: vehicle.id, route: route.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
