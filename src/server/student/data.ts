import prisma from "@/lib/prisma";
import { parseLearningPlanSubjects } from "@/lib/mentor";
import {
  addDays,
  calculatePercentage,
  startOfWeek,
  todayDateOnly,
} from "@/lib/portal";

export async function getStudentAccountByUserId(userId: string) {
  return prisma.studentAccount.findUnique({
    where: { userId },
    include: {
      batch: {
        include: {
          progress: true,
        },
      },
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function getStudentPortalSnapshot(userId: string) {
  const today = todayDateOnly();
  const tomorrow = addDays(today, 1);

  const student = await prisma.studentAccount.findUnique({
    where: { userId },
    include: {
      batch: {
        include: {
          progress: true,
        },
      },
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      learningPlans: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
      },
      classSchedules: {
        where: {
          scheduledDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        orderBy: [{ scheduledTime: "asc" }, { createdAt: "asc" }],
      },
      wellbeingEntries: {
        where: {
          date: today,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  if (!student) {
    return null;
  }

  const studentAccountId = student.id;
  const [attendanceRecords, recentAttendance, teacherMap, enrollments] =
    await Promise.all([
      prisma.attendance.findMany({
        where: {
          studentId: studentAccountId,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.attendance.findMany({
        where: {
          studentId: studentAccountId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 30,
      }),
      student.classSchedules.length
        ? prisma.user.findMany({
            where: {
              id: {
                in: student.classSchedules
                  .map((schedule) => schedule.teacherId)
                  .filter((teacherId): teacherId is string => Boolean(teacherId)),
              },
            },
            select: {
              id: true,
              name: true,
            },
          })
        : Promise.resolve([]),
      prisma.courseEnrollment.findMany({
        where: {
          userId,
        },
        include: {
          course: true,
        },
        orderBy: {
          enrolledAt: "desc",
        },
      }),
    ]);

  const presentCount = attendanceRecords.filter((record) => record.status === "present").length;
  const absentCount = attendanceRecords.filter((record) => record.status === "absent").length;
  const attendancePercentage = calculatePercentage(presentCount, absentCount);
  const learningPlan = student.learningPlans[0] ?? null;
  const todayMood = student.wellbeingEntries[0] ?? null;
  const teacherById = new Map(teacherMap.map((teacher) => [teacher.id, teacher.name]));

  return {
    student,
    learningPlan,
    attendancePercentage,
    attendanceSummary: {
      presentCount,
      absentCount,
      totalCount: presentCount + absentCount,
    },
    recentAttendance,
    todayClasses: student.classSchedules.map((schedule) => ({
      ...schedule,
      teacherName: schedule.teacherId
        ? (teacherById.get(schedule.teacherId) ?? "Teacher not assigned")
        : "Teacher not assigned",
    })),
    enrollments,
    todayMood,
  };
}

export async function getStudentAttendanceHistory(userId: string) {
  const student = await getStudentAccountByUserId(userId);
  if (!student) return [];
  return prisma.attendance.findMany({
    where: {
      studentId: student.id,
    },
    orderBy: [{ createdAt: "desc" }, { dayNumber: "desc" }],
  });
}

export async function getStudentPlan(userId: string) {
  const student = await getStudentAccountByUserId(userId);
  if (!student) return null;

  const plan = await prisma.learningPlan.findFirst({
    where: {
      studentId: student.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (!plan) {
    return null;
  }

  return {
    ...plan,
    parsedSubjects: parseLearningPlanSubjects(plan.subjects),
  };
}

export async function getStudentCourses(userId: string) {
  return prisma.courseEnrollment.findMany({
    where: {
      userId,
    },
    include: {
      course: true,
    },
    orderBy: {
      enrolledAt: "desc",
    },
  });
}

export async function getStudentMoodToday(userId: string) {
  const student = await getStudentAccountByUserId(userId);
  if (!student) return null;
  return prisma.studentWellbeing.findUnique({
    where: {
      studentId_date: {
        studentId: student.id,
        date: todayDateOnly(),
      },
    },
  });
}

export async function getStudentAttendanceThisWeek(userId: string) {
  const student = await getStudentAccountByUserId(userId);
  if (!student) return [];
  const start = startOfWeek(new Date());
  return prisma.attendance.findMany({
    where: {
      studentId: student.id,
      createdAt: {
        gte: start,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
