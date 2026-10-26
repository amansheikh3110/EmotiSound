"""
EmotiSound SQLite Repository
Handles thread-safe persistence and querying of speech emotion analysis history records.
"""

from pathlib import Path
from typing import Dict, Any, List, Optional
import sqlite3
import json
import uuid
from datetime import datetime, timezone

from backend.config import Config


class AnalysisRepository:
    """Thread-safe SQLite repository for audio emotion inference history."""

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = Path(db_path) if db_path else Config.DATABASE_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Creates the analysis_history table if it does not already exist."""
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS analysis_history (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    predicted_emotion TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    probabilities_json TEXT NOT NULL,
                    original_duration REAL NOT NULL,
                    processed_duration REAL NOT NULL,
                    was_padded INTEGER NOT NULL,
                    was_truncated INTEGER NOT NULL,
                    model_version TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.commit()

    def save_analysis(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves a new analysis record."""
        record_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()

        audio_meta = data.get("audio_metadata", {})
        probs_json = json.dumps(data.get("probabilities", {}))

        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO analysis_history (
                    id, filename, predicted_emotion, confidence,
                    probabilities_json, original_duration, processed_duration,
                    was_padded, was_truncated, model_version, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record_id,
                    data.get("filename", "audio_input"),
                    data.get("predicted_emotion", "unknown"),
                    float(data.get("confidence", 0.0)),
                    probs_json,
                    float(audio_meta.get("original_duration", 0.0)),
                    float(audio_meta.get("processed_duration", 0.0)),
                    1 if audio_meta.get("was_padded") else 0,
                    1 if audio_meta.get("was_truncated") else 0,
                    data.get("model_info", {}).get("version", "1.0.0"),
                    created_at,
                ),
            )
            conn.commit()

        return self.get_by_id(record_id)

    def get_all(
        self,
        limit: int = 50,
        offset: int = 0,
        emotion_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Retrieves paginated analysis records, sorted by created_at DESC."""
        query = "SELECT * FROM analysis_history"
        params: List[Any] = []

        if emotion_filter:
            query += " WHERE LOWER(predicted_emotion) = ?"
            params.append(emotion_filter.lower())

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()

            count_query = "SELECT COUNT(*) FROM analysis_history"
            count_params: List[Any] = []
            if emotion_filter:
                count_query += " WHERE LOWER(predicted_emotion) = ?"
                count_params.append(emotion_filter.lower())

            cursor.execute(count_query, count_params)
            total_count = cursor.fetchone()[0]

        items = [self._row_to_dict(r) for r in rows]
        return {
            "items": items,
            "total": total_count,
            "limit": limit,
            "offset": offset,
        }

    def get_by_id(self, record_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single record by its UUID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM analysis_history WHERE id = ?", (record_id,))
            row = cursor.fetchone()
            if row:
                return self._row_to_dict(row)
        return None

    def delete_by_id(self, record_id: str) -> bool:
        """Deletes a record by UUID. Returns True if deleted."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM analysis_history WHERE id = ?", (record_id,))
            conn.commit()
            return cursor.rowcount > 0

    def get_stats(self) -> Dict[str, Any]:
        """Returns summary statistics across stored analyses."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM analysis_history")
            total = cursor.fetchone()[0]

            cursor.execute(
                """
                SELECT predicted_emotion, COUNT(*) as cnt
                FROM analysis_history
                GROUP BY predicted_emotion
                ORDER BY cnt DESC
                """
            )
            emotion_distribution = {row["predicted_emotion"]: row["cnt"] for row in cursor.fetchall()}

        return {
            "total_analyses": total,
            "emotion_distribution": emotion_distribution,
        }

    def _row_to_dict(self, row: sqlite3.Row) -> Dict[str, Any]:
        return {
            "id": row["id"],
            "filename": row["filename"],
            "predicted_emotion": row["predicted_emotion"],
            "confidence": row["confidence"],
            "probabilities": json.loads(row["probabilities_json"]),
            "audio_metadata": {
                "original_duration": row["original_duration"],
                "processed_duration": row["processed_duration"],
                "was_padded": bool(row["was_padded"]),
                "was_truncated": bool(row["was_truncated"]),
            },
            "model_version": row["model_version"],
            "created_at": row["created_at"],
        }
