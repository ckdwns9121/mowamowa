DROP TRIGGER IF EXISTS work_items_transition_guard;
DROP TRIGGER IF EXISTS work_items_direct_completion_release_focus;

CREATE TRIGGER work_items_transition_guard
BEFORE UPDATE OF status, checkpoint, next_action, blocked_reason, resume_condition, next_review_at, revision
ON work_items
FOR EACH ROW
WHEN NEW.status IS NOT OLD.status
  OR NEW.checkpoint IS NOT OLD.checkpoint
  OR NEW.next_action IS NOT OLD.next_action
  OR NEW.blocked_reason IS NOT OLD.blocked_reason
  OR NEW.resume_condition IS NOT OLD.resume_condition
  OR NEW.next_review_at IS NOT OLD.next_review_at
BEGIN
  SELECT CASE WHEN NEW.revision <> OLD.revision + 1
    THEN RAISE(ABORT, 'work_item_revision_conflict') END;
  SELECT CASE WHEN NEW.status = 'blocked'
      AND (length(trim(COALESCE(NEW.blocked_reason, ''))) = 0
        OR length(trim(COALESCE(NEW.resume_condition, ''))) = 0)
    THEN RAISE(ABORT, 'blocked_requires_reason_and_resume_condition') END;
  SELECT CASE WHEN OLD.status = 'focus' AND NEW.status <> 'focus' AND NEW.status <> 'done'
      AND (length(trim(COALESCE(NEW.checkpoint, ''))) = 0
        OR length(trim(COALESCE(NEW.next_action, ''))) = 0)
    THEN RAISE(ABORT, 'focus_release_requires_checkpoint_and_next_action') END;
  SELECT CASE WHEN OLD.status = 'focus' AND NEW.status <> 'focus' AND NEW.status <> 'done'
      AND NOT EXISTS (
        SELECT 1 FROM work_focus_transition_commands c
        WHERE c.correlation_id = NEW.transition_correlation_id AND c.status = 'pending'
      )
    THEN RAISE(ABORT, 'focus_release_requires_command') END;
  SELECT CASE WHEN NEW.status = 'focus' AND OLD.status <> 'focus'
      AND NOT EXISTS (
        SELECT 1 FROM work_focus_transition_commands c
        WHERE c.correlation_id = NEW.transition_correlation_id AND c.status = 'pending'
      )
    THEN RAISE(ABORT, 'focus_requires_command') END;
END;

CREATE TRIGGER work_items_direct_completion_release_focus
AFTER UPDATE OF status ON work_items
FOR EACH ROW
WHEN NEW.status = 'done' AND OLD.status <> 'done'
BEGIN
  UPDATE work_focus_slot
  SET work_item_id = NULL, revision = revision + 1, updated_at = NEW.updated_at
  WHERE slot = 1 AND work_item_id = NEW.id;
END;
