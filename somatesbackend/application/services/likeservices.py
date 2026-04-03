from sqlalchemy.orm import Session
from application.models.likes import Like

def like_post(db: Session, user_id: int, post_id: int):

    # Check if already liked
    existing = db.query(Like).filter(
        Like.user_id == user_id,
        Like.post_id == post_id
    ).first()

    if existing:
        return None

    like = Like(user_id=user_id, post_id=post_id)

    db.add(like)
    db.commit()
    db.refresh(like)

    return like


def unlike_post(db: Session, user_id: int, post_id: int):

    like = db.query(Like).filter(
        Like.user_id == user_id,
        Like.post_id == post_id
    ).first()

    if not like:
        return None

    db.delete(like)
    db.commit()

    return like
