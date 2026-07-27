import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import * as XLSX from "xlsx";
import { authOptions } from "@/app/lib/auth";
import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

const REQUIRED_HEADERS = [
  "date",
  "revenue",
  "users",
  "conversions",
] as const;

function parseDateValue(value: unknown): Date {
  if (value === null || value === undefined) {
    throw new Error("Date value is missing.");
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    return new Date((value - 25569) * 86400 * 1000);
  }

  const stringValue = String(value).trim();

  if (!stringValue) {
    throw new Error("Date value is missing.");
  }

  const normalizedValue = stringValue.replace(/\//g, "-");
  const parsedDate = new Date(normalizedValue);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  const alternateParsedDate = new Date(`${normalizedValue}T00:00:00`);

  if (!Number.isNaN(alternateParsedDate.getTime())) {
    return alternateParsedDate;
  }

  throw new Error(`Invalid date value: ${stringValue}`);
}

function parseUploadedRows(rows: Record<string, unknown>[]) {
  return rows.map((row, rowIndex) => {
    const normalizedRow = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        String(key).trim().toLowerCase(),
        value,
      ])
    );

    const missingHeaders = REQUIRED_HEADERS.filter(
      (header) => !(header in normalizedRow)
    );

    if (missingHeaders.length > 0) {
      throw new Error(
        `Missing required columns in row ${rowIndex + 2}: ${missingHeaders.join(", ")}`
      );
    }

    const dateValue = parseDateValue(normalizedRow.date);
    const revenueValue = Number(normalizedRow.revenue);
    const usersValue = Number(normalizedRow.users);
    const conversionsValue = Number(normalizedRow.conversions);

    if (
      [revenueValue, usersValue, conversionsValue].some((value) =>
        Number.isNaN(value)
      )
    ) {
      throw new Error(
        `Invalid numeric value in row ${rowIndex + 2}. Revenue, users, and conversions must be numbers.`
      );
    }

    return {
      date: dateValue,
      revenue: revenueValue,
      users: usersValue,
      conversions: conversionsValue,
    };
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "No file uploaded." },
        { status: 400 }
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !["csv", "xlsx", "xls"].includes(extension)) {
      return NextResponse.json(
        { message: "Unsupported file type. Please upload CSV, XLS, or XLSX." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), {
      type: "buffer",
    });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    if (!rows.length) {
      return NextResponse.json(
        { message: "The uploaded file does not contain any rows." },
        { status: 400 }
      );
    }

    const parsedRows = parseUploadedRows(rows);

    const result = await prisma.metric.createMany({
      data: parsedRows.map((row) => ({
        date: row.date,
        revenue: row.revenue,
        users: row.users,
        conversions: row.conversions,
        userId: user.id,
      })),
    });

    return NextResponse.json({
      success: true,
      count: result.count,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to save metrics",
      },
      { status: 500 }
    );
  }
}