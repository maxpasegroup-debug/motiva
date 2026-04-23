import prisma from "@/lib/prisma";
import { parseLearningPlanSubjects } from "@/lib/mentor";
import {
  addDays,
  calculatePercentage,
  startOfWeek,
  todayDateOnly,
} from "@/lib/portal";

export async function getStudentPortalSnapshot(studentId: string) {
  const today = todayDateOnly();
  const tomorrow = addDays(today, 1);

  const student = await prisma.studentAccount.findUnique({
    where: { id: studentId },
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

  const [attendanceRecords, recentAttendance, teacherMap, enrollments] = await Promise.all([
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
        userId: studentId,
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

export async function getStudentAttendanceHistory(studentId: string) {
  return prisma.attendance.findMany({
    where: {
      studentId,
    },
    orderBy: [{ createdAt: "desc" }, { dayNumber: "desc" }],
  });
}

export async function getStudentPlan(studentId: string) {
  const plan = await prisma.learningPlan.findFirst({
    where: {
      studentId,
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

export async function getStudentCourses(studentId: string) {
  return prisma.courseEnrollment.findMany({
    where: {
      userId: studentId,
    },
    include: {
      course: true,
    },
    orderBy: {
      enrolledAt: "desc",
    },
  });
}

export async function getStudentMoodToday(studentId: string) {
  return prisma.studentWellbeing.findUnique({
    where: {
      studentId_date: {
        studentId,
        date: todayDateOnly(),
      },
    },
  });
}

export async function getStudentAttendanceThisWeek(studentId: string) {
  const start = startOfWeek(new Date());
  return prisma.attendance.findMany({
    where: {
      studentId,
      createdAt: {
        gte: start,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}
