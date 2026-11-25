package com.smartcampus.catalog.repository;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import java.util.Locale;

// Case-insensitive text matching in portable SQL: LOWER(column) LIKE '%text%' ESCAPE '\'.
// Not ILIKE, which only PostgreSQL has (CLAUDE.md: the database must stay swappable).
final class SearchText {

    private static final char ESCAPE = '\\';

    private SearchText() {
    }

    // "column contains text". % and _ are wildcards in LIKE, so a user typing "100%" would otherwise
    // match everything starting with "100". Escaping makes them match literally.
    static Predicate contains(CriteriaBuilder cb, Expression<String> column, String text) {
        String pattern = "%" + escape(text.trim().toLowerCase(Locale.ROOT)) + "%";
        return cb.like(cb.lower(column), pattern, ESCAPE);
    }

    // "column equals text", ignoring case (filters chosen from a dropdown, e.g. building)
    static Predicate equalsIgnoreCase(CriteriaBuilder cb, Expression<String> column, String text) {
        return cb.equal(cb.lower(column), text.trim().toLowerCase(Locale.ROOT));
    }

    private static String escape(String text) {
        return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
