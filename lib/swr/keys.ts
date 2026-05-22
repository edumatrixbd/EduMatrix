/**
 * Centralized SWR cache key factory.
 * All keys are JSON strings so they are serializable and comparable by SWR.
 */

const PAGE_SIZE = 12

export const swrKeys = {
  courses: {
    list: (page: number, search: string, university_id?: string, department_id?: string, batch_id?: string) => {
      const filters = []
      if (university_id) filters.push({ column: "university_id", op: "eq", value: university_id })
      if (department_id) filters.push({ column: "department_id", op: "eq", value: department_id })
      if (batch_id) filters.push({ column: "batch_id", op: "eq", value: batch_id })

      return JSON.stringify({
        table: "courses",
        select: "id, course_code, course_name, instructor, semester, status, university_id, department_id, batch_id",
        search: search
          ? { query: search, fields: ["course_name", "course_code"] }
          : undefined,
        filters,
        orderBy: [
          { column: "semester", ascending: true },
          { column: "course_code", ascending: true },
        ],
        page,
        pageSize: PAGE_SIZE,
      })
    },
  },

  notes: {
    list: (page: number, search: string) =>
      JSON.stringify({
        table: "content_materials",
        select: "id, title, type, file_url, courses(course_name, course_code)",
        filters: [{ column: "type", op: "eq", value: "note" }],
        search: search
          ? { query: search, fields: ["title"] }
          : undefined,
        orderBy: [{ column: "created_at", ascending: false }],
        page,
        pageSize: PAGE_SIZE,
      }),
  },

  videos: {
    list: (page: number, search: string, university_id?: string, department_id?: string, batch_id?: string) => {
      const filters: any[] = [{ column: "type", op: "eq", value: "video" }]
      if (batch_id) filters.push({ column: "batch_id", op: "eq", value: batch_id })

      return JSON.stringify({
        table: "content_materials",
        select: "id, title, type, file_url, courses(id, course_name, course_code)",
        filters,
        search: search
          ? { query: search, fields: ["title"] }
          : undefined,
        orderBy: [{ column: "created_at", ascending: false }],
        page,
        pageSize: PAGE_SIZE,
      })
    },
  },

  questions: {
    list: (page: number, search: string) =>
      JSON.stringify({
        table: "content_materials",
        select: "id, title, type, file_url, courses(course_name, course_code)",
        filters: [{ column: "type", op: "eq", value: "previous_question" }],
        search: search
          ? { query: search, fields: ["title"] }
          : undefined,
        orderBy: [
          { column: "created_at", ascending: false },
        ],
        page,
        pageSize: PAGE_SIZE,
      }),
  },

  solved: {
    list: (page: number, search: string) =>
      JSON.stringify({
        table: "content_materials",
        select: "id, title, type, file_url, courses(course_name, course_code)",
        filters: [{ column: "type", op: "eq", value: "solved_answer" }],
        search: search
          ? { query: search, fields: ["title"] }
          : undefined,
        orderBy: [{ column: "created_at", ascending: false }],
        page,
        pageSize: PAGE_SIZE,
      }),
  },

  dashboard: {
    stats: (university_id?: string, department_id?: string, batch_id?: string) =>
      JSON.stringify({
        table: "dashboard_stats",
        type: "multi_count",
        university_id,
        department_id,
        batch_id
      }),
    recentUploads: (university_id?: string, department_id?: string, batch_id?: string) =>
      JSON.stringify({
        table: "dashboard_recent",
        type: "multi_union",
        university_id,
        department_id,
        batch_id
      })
  }
}

export const PAGE_SIZE_EXPORT = PAGE_SIZE
