import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from quotelens.store import CosmosStore, MemoryStore

STORES = ["memory"] + (["cosmos"] if os.environ.get("COSMOS_ENDPOINT") else [])


@pytest.fixture(params=STORES)
def store(request):
    if request.param == "memory":
        return MemoryStore()
    return CosmosStore(os.environ["COSMOS_ENDPOINT"], os.environ["COSMOS_KEY"], "quotelens-test")
