import tempfile
import unittest
from pathlib import Path

from mock.sheet_report import build_report, load_orders, parse_amount

ROOT = Path(__file__).resolve().parents[1]
SAMPLE = ROOT / "mock" / "sample_orders.csv"


class AmountTests(unittest.TestCase):
    def test_russian_money_format(self):
        self.assertEqual(parse_amount("1 500,50 ₽"), 1500.5)
        self.assertEqual(parse_amount("2\u00a0000"), 2000.0)
        self.assertEqual(parse_amount("bad"), 0.0)


class ReportTests(unittest.TestCase):
    def test_sample_report(self):
        report = build_report(load_orders(SAMPLE))
        self.assertEqual(report["orders"], 5)
        self.assertEqual(report["total"], 8900.0)
        self.assertEqual(report["latest_date"], "2026-10-28")
        self.assertEqual(report["by_status"]["оплачен"]["count"], 2)
        self.assertEqual(report["by_status"]["оплачен"]["total"], 5500.0)

    def test_missing_columns(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bad.csv"
            path.write_text("date,amount\n2026-01-01,10\n", encoding="utf-8")
            with self.assertRaises(ValueError):
                load_orders(path)

    def test_blank_rows_are_ignored(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "orders.csv"
            path.write_text(
                "date,customer,status,amount\n"
                "2026-01-01,Анна,новый,100\n"
                ",,\n",
                encoding="utf-8",
            )
            report = build_report(load_orders(path))
            self.assertEqual(report["orders"], 1)
            self.assertEqual(report["total"], 100.0)


if __name__ == "__main__":
    unittest.main()
