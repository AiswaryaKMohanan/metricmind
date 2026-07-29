import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const datasetDate = searchParams.get("date");

    if (!datasetDate) {
      return NextResponse.json(
        { message: "Missing dataset date parameter" },
        { status: 400 }
      );
    }

    const startOfDay = new Date(`${datasetDate}T00:00:00.000Z`);
    const endOfDay = new Date(`${datasetDate}T23:59:59.999Z`);

    const rows = await prisma.metric.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    if (!rows.length) {
      return NextResponse.json(
        { message: "No rows found for the selected dataset" },
        { status: 404 }
      );
    }

    const totalRevenue = rows.reduce((sum, row) => sum + Number(row.revenue), 0);
    const totalUsers = rows.reduce((sum, row) => sum + Number(row.users), 0);
    const totalConversions = rows.reduce(
      (sum, row) => sum + Number(row.conversions),
      0
    );

    const bestRevenueRow = rows.reduce((best, current) =>
      Number(current.revenue) > Number(best.revenue) ? current : best
    );

    const firstRow = rows[0];
    const lastRow = rows[rows.length - 1];
    const revenueDelta = Number(lastRow.revenue) - Number(firstRow.revenue);
    const conversionRate = totalUsers > 0 ? (totalConversions / totalUsers) * 100 : 0;

    const previousBatchRows = await prisma.metric.findMany({
      where: {
        userId: user.id,
        createdAt: {
          lt: startOfDay,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const previousBatchRevenue = previousBatchRows.reduce(
      (sum, row) => sum + Number(row.revenue),
      0
    );
    const previousBatchUsers = previousBatchRows.reduce(
      (sum, row) => sum + Number(row.users),
      0
    );
    const previousBatchConversions = previousBatchRows.reduce(
      (sum, row) => sum + Number(row.conversions),
      0
    );

    const previousBatchDate = previousBatchRows[0]
      ? new Date(previousBatchRows[0].createdAt).toISOString().slice(0, 10)
      : null;

    const revenueChangePct = previousBatchRevenue
      ? ((totalRevenue - previousBatchRevenue) / previousBatchRevenue) * 100
      : 0;
    const userChangePct = previousBatchUsers
      ? ((totalUsers - previousBatchUsers) / previousBatchUsers) * 100
      : 0;
    const conversionChangePct = previousBatchConversions
      ? ((totalConversions - previousBatchConversions) / previousBatchConversions) * 100
      : 0;

    const trendLabel =
      revenueDelta > 0
        ? "upward"
        : revenueDelta < 0
          ? "downward"
          : "flat";

    const compareText = previousBatchDate
      ? `Compared with the previous batch on ${previousBatchDate}, this dataset is ${Math.abs(revenueChangePct).toFixed(1)}% ${revenueChangePct >= 0 ? "higher" : "lower"} in revenue, ${Math.abs(userChangePct).toFixed(1)}% ${userChangePct >= 0 ? "higher" : "lower"} in users, and ${Math.abs(conversionChangePct).toFixed(1)}% ${conversionChangePct >= 0 ? "higher" : "lower"} in conversions.`
      : "This is the first uploaded batch for this account, so there is no historical batch to compare against yet.";

    const trendNarrative =
      revenueDelta > 0
        ? "Revenue increased within the batch, indicating a healthy upward movement."
        : revenueDelta < 0
          ? "Revenue softened within the batch, which may point to a dip in momentum."
          : "Revenue stayed flat within the batch, suggesting steady but unchanged performance.";

    const recommendation =
      conversionRate >= 5
        ? "Conversion performance looks strong; focus on scaling the winning channels."
        : "Conversion performance is still developing; test messaging and funnel steps to improve results.";

    const insightText = [
      `This dataset contains ${rows.length} rows uploaded on ${datasetDate}.`,
      `It generated ${totalRevenue.toFixed(2)} in revenue from ${totalUsers} users and ${totalConversions} conversions.`,
      `The conversion rate is ${conversionRate.toFixed(2)}%, and the revenue trend across the batch is ${trendLabel}.`,
      `The highest revenue point was ${new Date(bestRevenueRow.date).toISOString().slice(0, 10)} with ${bestRevenueRow.revenue}.`,
      compareText,
    ].join(" ");

    return NextResponse.json({
      datasetDate,
      rowsCount: rows.length,
      totalRevenue,
      totalUsers,
      totalConversions,
      conversionRate,
      bestRevenueDay: new Date(bestRevenueRow.date).toISOString().slice(0, 10),
      revenueDelta,
      trendNarrative,
      recommendation,
      insightText,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate insights",
      },
      { status: 500 }
    );
  }
}
