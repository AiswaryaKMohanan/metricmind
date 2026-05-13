import { getServerSession } from "next-auth";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

// ➕ Create metric
export async function POST(req: Request) {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, value } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  const metric = await prisma.metric.create({
    data: {
      title,
      value: Number(value),
      userId: user!.id,
    },
  });

  return Response.json(metric);
}

// 📊 Get metrics
export async function GET() {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  const metrics = await prisma.metric.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(metrics);
}