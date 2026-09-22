import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEPARTMENTS = ["CSE", "IT", "ECE", "EEE", "Mechanical", "Civil", "AI & DS"];

const MENTORS = [
  { email: "mentor1@hackathon.dev", name: "Dr. Arun Kumar", spec: "Cloud Computing", phone: "9876500001" },
  { email: "mentor2@hackathon.dev", name: "Dr. Meera Iyer", spec: "Artificial Intelligence", phone: "9876500002" },
  { email: "mentor3@hackathon.dev", name: "Prof. Rahul Nair", spec: "Cybersecurity", phone: "9876500003" },
  { email: "mentor4@hackathon.dev", name: "Dr. Sneha Rao", spec: "IoT Systems", phone: "9876500004" },
  { email: "mentor5@hackathon.dev", name: "Prof. Vikram Shah", spec: "Full Stack Engineering", phone: "9876500005" },
];

async function main() {
  console.log("Seeding departments...");
  const deptMap: Record<string, string> = {};
  for (const name of DEPARTMENTS) {
    const dept = await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
    deptMap[name] = dept.id;
  }

  console.log("Seeding demo admin account...");
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 12);
  await prisma.user.upsert({
    where: { email: "admin@hackathon.dev" },
    update: {},
    create: {
      email: "admin@hackathon.dev",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  console.log("Seeding a demo hackathon...");
  await prisma.hackathon.upsert({
    where: { id: "demo-hackathon" },
    update: {},
    create: { id: "demo-hackathon", name: "Demo Hackathon 2026", isActive: true },
  });

  console.log("Seeding demo mentor accounts...");
  const mentorPasswordHash = await bcrypt.hash("Mentor@12345", 12);
  for (const mentor of MENTORS) {
    const user = await prisma.user.upsert({
      where: { email: mentor.email },
      update: { role: "MENTOR" },
      create: { email: mentor.email, passwordHash: mentorPasswordHash, role: "MENTOR" },
    });
    await prisma.mentorProfile.upsert({
      where: { userId: user.id },
      update: { fullName: mentor.name, specialization: mentor.spec, phone: mentor.phone },
      create: {
        userId: user.id,
        fullName: mentor.name,
        specialization: mentor.spec,
        phone: mentor.phone,
      },
    });
  }

  console.log("Seed complete.");
  console.log("---");
  console.log("Demo admin login: admin@hackathon.dev / Admin@12345");
  console.log("Demo mentor login: mentor1@hackathon.dev / Mentor@12345 (through mentor5)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
