"""Deterministic-invariant tests for the SubjectiveBet contract.

ANCHOR: 0 <= winning_index < len(options); winning_index is int (not bool);
reasoning non-empty.
"""

NUM_OPTIONS = 3


def test_normalized_output_always_passes(contract):
    samples = [
        {"winning_index": 1, "reasoning": "x"},
        {"winning_index": 99, "reasoning": ""},     # out of range -> clamped
        {"winning_index": True, "reasoning": "x"},  # bool -> coerced to 0
        {"winning_index": -5},
        {},
        "not a dict",
        None,
    ]
    for raw in samples:
        v = contract.normalize_verdict(raw, NUM_OPTIONS)
        assert contract.validate_verdict(v, NUM_OPTIONS), raw
        assert 0 <= v["winning_index"] < NUM_OPTIONS


def test_out_of_range_rejected(contract):
    assert not contract.validate_verdict({"winning_index": 3, "reasoning": "x"}, NUM_OPTIONS)
    assert not contract.validate_verdict({"winning_index": -1, "reasoning": "x"}, NUM_OPTIONS)


def test_bool_index_rejected(contract):
    # True is 1 (in range) but must be rejected as it is not a real int index
    assert not contract.validate_verdict({"winning_index": True, "reasoning": "x"}, NUM_OPTIONS)
    assert not contract.validate_verdict({"winning_index": False, "reasoning": "x"}, NUM_OPTIONS)


def test_non_int_index_rejected(contract):
    assert not contract.validate_verdict({"winning_index": "1", "reasoning": "x"}, NUM_OPTIONS)
    assert not contract.validate_verdict({"winning_index": 1.0, "reasoning": "x"}, NUM_OPTIONS)


def test_empty_reasoning_rejected(contract):
    assert not contract.validate_verdict({"winning_index": 0, "reasoning": "   "}, NUM_OPTIONS)
    assert not contract.validate_verdict({"winning_index": 0}, NUM_OPTIONS)
