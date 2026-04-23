import prisma from "@/lib/prisma";
import {
  addDays,
  calculateAttendancePercentage,
  endOfDay,
  startOfDay,
  startOfWeek,
} from "@/lib/mentor";

export async function getMentorStudents(mentorId: string) {
  return prisma.studentAccount.findMany({
    where: { mentorId },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
        },
      },
      batch: {
        select: {
          id: true,
          name: true,
          duration: true,
          progress: {
            select: {
              currentDay: true,
            },
          },
        },
      },
      parentAccounts: {
        select: {
          id: true,
          name: true,
          mobile: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      learningPlans: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      studentName: "asc",
    },
  });
}

export async function getAttendancePercentages(studentIds: string[]) {
  if (studentIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await prisma.attendance.findMany({
    where: {
      studentId: {
        in: studentIds,
      },
    },
    select: {
      studentId: true,
      status: true,
    },
  });

  const counts = new Map<string, { present: number; absent: number }>();

  for (const row of rows) {
    const current = counts.get(row.studentId) ?? { present: 0, absent: 0 };
    if (row.status === "present") {
      current.present += 1;
    } else if (row.status === "absent") {
      current.absent += 1;
    }
    counts.set(row.studentId, current);
  }

  const percentages = new Map<string, number>();
  for (const studentId of studentIds) {
    const current = counts.get(studentId) ?? { present: 0, absent: 0 };
    percentages.set(
      studentId,
      calculateAttendancePercentage(current.present, current.absent),
    );
  }

  return percentages;
}

export async function getMentorDashboardSnapshot(mentorId: string) {
  const students = await getMentorStudents(mentorId);
  const studentIds = students.map((student) => student.id);
  const attendancePercentages = await getAttendancePercentages(studentIds);

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const [classesToday, pendingIssuesCount] = await Promise.all([
    prisma.classSchedule.findMany({
      where: {
        mentorId,
        scheduledDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            studentName: true,
          },
        },
      },
      orderBy: [{ scheduledTime: "asc" }, { createdAt: "asc" }],
    }),
    prisma.issue.count({
      where: {
        OR: [{ assignedToId: mentorId }, { assignedTo: mentorId }],
        status: {
          in: ["open", "in_progress"],
        },
      },
    }),
  ]);

  const teacherIds = classesToday
    .map((schedule) => schedule.teacherId)
    .filter((teacherId): teacherId is string => Boolean(teacherId));
  const teachers = teacherIds.length
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
    : [];
  const teacherMap = new Map(teachers.map((teacher) => [teacher.id, teacher.name]));

  const todayClasses = classesToday.map((schedule) => ({
    id: schedule.id,
    time: schedule.scheduledTime ?? "Time not set",
    subject: schedule.subject ?? schedule.topic ?? "Subject not set",
    studentName: schedule.student?.studentName ?? "Student not assigned",
    teacherName: schedule.teacherId
      ? (teacherMap.get(schedule.teacherId) ?? "Teacher not assigned")
      : "Teacher not assigned",
  }));

  const atRiskStudents = students.filter((student) => {
    return (attendancePercentages.get(student.id) ?? 0) < 70;
  });

  return {
    students,
    attendancePercentages,
    metrics: {
      totalStudents: students.length,
      classesToday: todayClasses.length,
      pendingIssues: pendingIssuesCount,
      atRiskStudents: atRiskStudents.length,
    },
    todayClasses,
  };
}

export async function getMentorStudentDetail(
  mentorId: string,
  studentId: string,
) {
  const student = await prisma.studentAccount.findFirst({
    where: {
      id: studentId,
      mentorId,
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      batch: {
        select: {
          id: true,
          name: true,
          duration: true,
          progress: {
            select: {
              currentDay: true,
            },
          },
        },
      },
      parentAccounts: {
        select: {
          id: true,
          name: true,
          mobile: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      learningPlans: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
      },
      issues: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!student) {
    return null;
  }

  const attendanceRecords =
    student.batchId && student.batch?.duration
      ? await prisma.attendance.findMany({
          where: {
            studentId: student.id,
            batchId: student.batchId,
          },
          orderBy: {
            dayNumber: "asc",
          },
          select: {
            id: true,
            dayNumber: true,
            status: true,
            createdAt: true,
          },
        })
      : [];

  const presentCount = attendanceRecords.filter(
    (record) => record.status === "present",
  ).length;
  const absentCount = attendanceRecords.filter(
    (record) => record.status === "absent",
  ).length;

  const totalCalendarDays = Math.max(
    student.batch?.duration ?? 0,
    attendanceRecords[attendanceRecords.length - 1]?.dayNumber ?? 0,
    14,
  );

  return {
    student,
    attendanceRecords,
    attendancePercentage: calculateAttendancePercentage(presentCount, absentCount),
    totalCalendarDays,
  };
}

export async function getMentorIssues(mentorId: string, status?: string) {
  return prisma.issue.findMany({
    where: {
      OR: [
        { assignedToId: mentorId },
        { assignedTo: mentorId },
        { raisedById: mentorId },
        { reportedBy: mentorId },
      ],
      ...(status && status !== "all" ? { status } : {}),
    },
    include: {
      student: {
        select: {
          id: true,
          studentName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getMentorIssueDetail(mentorId: string, issueId: string) {
  return prisma.issue.findFirst({
    where: {
      id: issueId,
      OR: [
        { assignedToId: mentorId },
        { assignedTo: mentorId },
        { raisedById: mentorId },
        { reportedBy: mentorId },
      ],
    },
    include: {
      student: {
        select: {
          id: true,
          studentName: true,
          programType: true,
        },
      },
    },
  });
}

export async function getMentorScheduleForWeek(
  mentorId: string,
  weekDate?: Date,
) {
  const baseDate = weekDate ?? new Date();
  const weekStart = startOfWeek(baseDate);
  const weekEnd = addDays(weekStart, 6);

  const schedules = await prisma.classSchedule.findMany({
    where: {
      mentorId,
      scheduledDate: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    include: {
      student: {
        select: {
          id: true,
          studentName: true,
        },
      },
    },
    orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
  });

  const teacherIds = schedules
    .map((schedule) => schedule.teacherId)
    .filter((teacherId): teacherId is string => Boolean(teacherId));
  const teachers = teacherIds.length
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
    : [];

  const teacherMap = new Map(teachers.map((teacher) => [teacher.id, teacher.name]));

  return {
    weekStart,
    weekEnd,
    days: Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      const items = schedules.filter((schedule) => {
        if (!schedule.scheduledDate) {
          return false;
        }
        return schedule.scheduledDate.toDateString() === date.toDateString();
      });

      return {
        date,
        schedules: items.map((schedule) => ({
          ...schedule,
          teacherName: schedule.teacherId
            ? (teacherMap.get(schedule.teacherId) ?? "Teacher not assigned")
            : "Teacher not assigned",
        })),
      };
    }),
  };
}
