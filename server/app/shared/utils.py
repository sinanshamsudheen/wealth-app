import uuid


def generate_id() -> uuid.UUID:
    return uuid.uuid4()


def paginate(page: int, page_size: int, total_items: int) -> dict:
    total_pages = (total_items + page_size - 1) // page_size if total_items > 0 else 0
    return {
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }
