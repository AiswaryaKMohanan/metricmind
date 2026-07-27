import { getServerSession } from "next-auth";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

export async function GET() {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔥 Fetch user from DB
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  });
}


export async function PUT(req: Request) {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();

  const updatedUser = await prisma.user.update({
    where: { email: session.user.email },
    data: { name },
  });

  return Response.json(updatedUser);
}