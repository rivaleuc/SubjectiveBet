# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
import json
from genlayer import *


class SubjectiveBet(gl.Contract):
    markets: TreeMap[str, str]
    market_count: u256

    def __init__(self):
        self.market_count = u256(0)

    @gl.public.write
    def create_market(self, question: str, sport: str, match_info: str, options_json: str) -> str:
        question = str(question).strip()
        if not question:
            raise Exception("question required")
        try:
            options = json.loads(str(options_json))
        except Exception:
            raise Exception("options_json must be valid JSON array")
        if not isinstance(options, list) or len(options) < 2:
            raise Exception("need at least 2 options")

        key = str(int(self.market_count))
        market = {
            "creator": str(gl.message.sender_address),
            "question": question[:500],
            "sport": str(sport).strip(),
            "match_info": str(match_info).strip()[:300],
            "options": options,
            "bets": [],
            "resolved": False,
            "winning_index": -1,
            "reasoning": "",
        }
        self.markets[key] = json.dumps(market)
        self.market_count += u256(1)
        return key

    @gl.public.write
    def place_bet(self, market_key: str, option_index: int) -> None:
        market_key = str(market_key)
        if market_key not in self.markets:
            raise Exception("unknown market")
        market = json.loads(self.markets[market_key])
        if market["resolved"]:
            raise Exception("market resolved")
        idx = int(option_index)
        if idx < 0 or idx >= len(market["options"]):
            raise Exception("invalid option index")
        market["bets"].append({
            "bettor": str(gl.message.sender_address),
            "option": idx,
        })
        self.markets[market_key] = json.dumps(market)

    @gl.public.write
    def resolve_market(self, market_key: str) -> None:
        market_key = str(market_key)
        if market_key not in self.markets:
            raise Exception("unknown market")
        market = json.loads(self.markets[market_key])
        if market["resolved"]:
            raise Exception("already resolved")

        verdict = self._judge(market)
        market["resolved"] = True
        market["winning_index"] = verdict["winning_index"]
        market["reasoning"] = verdict["reasoning"]
        self.markets[market_key] = json.dumps(market)

    def _judge(self, market: dict) -> dict:
        question = market["question"]
        sport = market["sport"]
        match_info = market["match_info"]
        options = market["options"]

        def leader_fn() -> str:
            # Fetch sports news
            news = "(no news fetched)"
            search_query = f"{sport} {match_info} {question}"
            try:
                url = f"https://www.google.com/search?q={search_query.replace(' ', '+')}"
                raw = gl.nondet.web.render(url, mode="text", wait_after_loaded="2s")
                news = raw[:4000]
            except Exception:
                pass

            options_str = "\n".join([f"  {i}: {o}" for i, o in enumerate(options)])
            prompt = f"""You are judging a subjective sports outcome.

SPORT: {sport}
MATCH: {match_info}
QUESTION: {question}

OPTIONS:
{options_str}

SPORTS NEWS/ANALYSIS:
{news[:3000]}

RULES:
1. Pick the option that best answers the question based on evidence and expert consensus.
2. For subjective questions (MVP, best player), go with majority expert opinion.
3. For ref decisions, analyze the incident objectively.

Reply ONLY valid JSON:
{{"winning_index": <int>, "reasoning": "<explanation>"}}"""

            raw = gl.nondet.exec_prompt(prompt, response_format="json")
            if isinstance(raw, dict):
                return json.dumps(raw)
            return str(raw).strip()

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                data = json.loads(leader_result.calldata)
                idx = data.get("winning_index")
                if not isinstance(idx, int) or idx < 0 or idx >= len(options):
                    return False
                if not isinstance(data.get("reasoning"), str):
                    return False
                return True
            except Exception:
                return False

        result_str = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        return json.loads(result_str)

    @gl.public.view
    def get_market(self, key: str) -> dict:
        key = str(key)
        if key not in self.markets:
            return {"exists": False}
        return json.loads(self.markets[key])

    @gl.public.view
    def read_outcome(self, key: str) -> dict:
        key = str(key)
        if key not in self.markets:
            return {"resolved": False}
        m = json.loads(self.markets[key])
        if not m["resolved"]:
            return {"resolved": False}
        return {
            "resolved": True,
            "winning_index": m["winning_index"],
            "winning_label": m["options"][m["winning_index"]],
            "reasoning": m["reasoning"],
        }

    @gl.public.view
    def stats(self) -> dict:
        return {"total_markets": int(self.market_count)}
