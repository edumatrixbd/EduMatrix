/**
 * Centralized SWR cache key factory.
 * All keys are JSON strings so they are serializable and comparable by SWR.
 */

const PAGE_SIZE = 12

export const swrKeys = {
  courses: {
    list: (page: number, search: string) =>
      JSON.stringify({
        table: "courses",
        select: "id, course_code, course_name, instructor, semester, status",
        search: search
          ? { query: search, fields: ["course_name", "course_code"] }
          : undefined,
        orderBy: [
          { column: "semester", ascending: true },
          { column: "course_code", ascending: true },
        ],
        page,
        pageSize: PAGE_SIZE,
      }),
  },

  notes: {
    list: (page: number, search: string) =>
      JSON.stringify({
        table: "study_notes",
        select: "id, title, topic, courses(course_name, course_code)",
        search: search
          ? { query: search, fields: ["title", "content", "topic"] }
          : undefined,
        orderBy: [{ column: "created_at", ascending: false }],
        page,
        pageSize: PAGE_SIZE,
      }),
  },

  videos: {
    list: (page: number, search: string) =>
      JSON.stringify({
        table: "video_lectures",
        select: "id, title, duration, courses(course_name, course_code)",
        search: search
          ? { query: search, fields: ["title", "description"] }
          : undefined,
        orderBy: [{ column: "created_at", ascending: false }],
        page,
        pageSize: PAGE_SIZE,
      }),
  },

  questions: {
    list: (page: number, search: string) =>
      JSON.stringify({
        table: "previous_questions",
        select: "id, question_text, exam_type, exam_year, question_number, file_url, courses(course_name, course_code)",
        search: search
          ? { query: search, fields: ["question_text", "exam_type"] }
          : undefined,
        orderBy: [
          { column: "exam_year", ascending: false },
          { column: "created_at", ascending: false },
        ],
        page,
        pageSize: PAGE_SIZE,
      }),
  },

  solved: {
    list: (page: number, search: string) =>
      JSON.stringify({
        table: "solved_answers",
        select: "id, title, content, file_url, difficulty, courses(course_name, course_code)",
        search: search
          ? { query: search, fields: ["title", "content"] }
          : undefined,
        orderBy: [{ column: "created_at", ascending: false }],
        page,
        pageSize: PAGE_SIZE,
      }),
  },

  dashboard: {
    stats: () =>
      JSON.stringify({
        table: "dashboard_stats",
        type: "multi_count",
      }),
    recentUploads: () =>
      JSON.stringify({
        table: "dashboard_recent",
        type: "multi_union",
      })
  }
}

export const PAGE_SIZE_EXPORT = PAGE_SIZE
