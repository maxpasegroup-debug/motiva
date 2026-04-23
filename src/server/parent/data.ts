import prisma from "@/lib/prisma";
import { parseLearningPlanSubjects } from "@/lib/mentor";
import {
  addDays,
  calculatePercentage,
  startOfWeek,
  todayDateOnly,
} from "@/lib/portal";
import {
  countUnreadParentNotifications,
  listParentNotifications,
  markAllParentNotificationsRead,
  markParentNotificationsRead,
} from "@/server/parents/parents-portal-db";

export async function getParentPortalSnapshot(parentId: string) {
  const today = todayDateOnly();

  const parent = await prisma.parentAccount.findUnique({
    where: { id: parentId },
    include: {
      student: {
        include: {
          batch: {
            include: {
              progress: true,
            },
          },
          learningPlans: {
            orderBy: {
              updatedAt: "desc",
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!parent) {
    return null;
  }

  const studentId = parent.studentId;
  const weekStart = startOfWeek(new Date());

  const [attendanceRecords, recentAttendance, upcomingClasses, todayMood, moodTrend, notifications, unreadCount, teachers] =
    await Promise.all([
      prisma.attendance.findMany({
        where: {
          studentId,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.attendance.findMany({
        where: {
          studentId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
      prisma.classSchedule.findMany({
        where: {
          studentId,
          scheduledDate: {
            gte: today,
          },
        },
        orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
        take: 3,
      }),
      prisma.studentWellbeing.findUnique({
        where: {
          studentId_date: {
            studentId,
            date: today,
          },
        },
      }),
      prisma.studentWellbeing.findMany({
        where: {
          studentId,
          date: {
            gte: addDays(today, -6),
            lte: today,
          },
        },
        orderBy: {
          date: "asc",
        },
      }),
      listParentNotifications(parentId, 50),
      countUnreadParentNotifications(parentId),
      prisma.user.findMany({
        where: {
          id: {
            in: [],
          },
        },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

  const teacherIds = upcomingClasses
    .map((schedule) => schedule.teacherId)
    .filter((teacherId): teacherId is string => Boolean(teacherId));
  const teacherRows = teacherIds.length
    ? await prisma.user.findMany({
        where: {
          id: {
            in: teacherIds,
          },
        },
        select: {
          id: true,
          name: true,
        },
      })
    : teachers;
  const teacherMap = new Map(teacherRows.map((teacher) => [teacher.id, teacher.name]));

  const weeklyAttendance = attendanceRecords.filter((record) => record.createdAt >= weekStart);
  const weeklyPresent = weeklyAttendance.filter((record) => record.status === "present").length;
  const weeklyAbsent = weeklyAttendance.filter((record) => record.status === "absent").length;

  const latestPlan = parent.student.learningPlans[0] ?? null;

  return {
    parent,
    child: parent.student,
    weeklyAttendancePercentage: calculatePercentage(weeklyPresent, weeklyAbsent),
    recentAttendance,
    upcomingClasses: upcomingClasses.map((schedule) => ({
      ...schedule,
      teacherName: schedule.teacherId
        ? (teacherMap.get(schedule.teacherId) ?? "Teacher not assigned")
        : "Teacher not assigned",
    })),
    latestPlan: latestPlan
      ? {
          ...latestPlan,
          parsedSubjects: parseLearningPlanSubjects(latestPlan.subjects),
        }
      : null,
    todayMood,
    moodTrend,
    notifications,
    unreadCount,
  };
}

export async function markParentNotifications(parentId: string, notificationIds: string[]) {
  await markParentNotificationsRead(parentId, notificationIds);
}

export async function markAllParentNotifications(parentId: string) {
  await markAllParentNotificationsRead(parentId);
}

export async function getParentChildProgress(parentId: string) {
  const parent = await prisma.parentAccount.findUnique({
    where: {
      id: parentId,
    },
    include: {
      student: {
        include: {
          batch: {
            include: {
              progress: true,
            },
          },
        },
      },
    },
  });

  if (!parent) {
    return null;
  }

  const studentId = parent.studentId;
  const today = todayDateOnly();
  const weekStart = startOfWeek(new Date());

  const [attendance, mood, schedule] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        studentId,
      },
      orderBy: [{ createdAt: "desc" }, { dayNumber: "desc" }],
    }),
    prisma.studentWellbeing.findMany({
      where: {
        studentId,
        date: {
          gte: addDays(today, -6),
          lte: today,
        },
      },
      orderBy: {
        date: "asc",
      },
    }),
    prisma.classSchedule.findMany({
      where: {
        studentId,
      },
      orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
    }),
  ]);

  const weeklyAttendance = attendance.filter((record) => record.createdAt >= weekStart);
  const present = weeklyAttendance.filter((record) => record.status === "present").length;
  const absent = weeklyAttendance.filter((record) => record.status === "absent").length;

  return {
    parent,
    child: parent.student,
    attendance,
    mood,
    schedule,
    weekly: {
      present,
      absent,
      percentage: calculatePercentage(present, absent),
    },
  };
}
