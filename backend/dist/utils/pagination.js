"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.paginated = paginated;
function parsePagination(query) {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const pageSize = Math.min(1000, Math.max(1, Number(query.pageSize ?? 20) || 20));
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
function paginated(items, total, page, pageSize) {
    return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
}
