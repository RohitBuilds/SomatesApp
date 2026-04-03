from sqlalchemy.orm import Session
from application.models.comments import Comment

def add_comment(db: Session, user_id: int, post_id: int, content: str):

    comment = Comment(
        user_id=user_id,
        post_id=post_id,
        content=content
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    return comment


def delete_comment(db: Session, comment_id: int, user_id: int):

    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.user_id == user_id
    ).first()

    if not comment:
        return None

    db.delete(comment)
    db.commit()

    return comment
