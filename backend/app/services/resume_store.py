from collections import OrderedDict
from threading import Lock
from uuid import uuid4


class ResumeStore:
    def __init__(self, max_items: int = 200) -> None:
        self._max_items = max_items
        self._store: OrderedDict[str, str] = OrderedDict()
        self._lock = Lock()

    def add(self, resume_text: str) -> str:
        with self._lock:
            resume_id = str(uuid4())
            self._store[resume_id] = resume_text
            self._store.move_to_end(resume_id)

            while len(self._store) > self._max_items:
                self._store.popitem(last=False)

            return resume_id

    def get(self, resume_id: str) -> str | None:
        with self._lock:
            value = self._store.get(resume_id)
            if value is not None:
                self._store.move_to_end(resume_id)
            return value


resume_store = ResumeStore()
