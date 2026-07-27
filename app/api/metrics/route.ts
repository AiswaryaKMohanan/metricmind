import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

// ➕ Create metric
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date, revenue, users, conversions } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const metric = await prisma.metric.create({
    data: {
      date: new Date(date),
      revenue: Number(revenue),
      users: Number(users),
      conversions: Number(conversions),
      userId: user.id,
    },
  });

  return Response.json(metric);
}

// 📊 Get metrics
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const metrics = await prisma.metric.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(metrics);
}