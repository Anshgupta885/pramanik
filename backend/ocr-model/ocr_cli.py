from __future__ import annotations

import base64
import json
import sys

from ocr_model import process_certificate, result_to_dict


def main() -> int:
    raw_input = sys.stdin.read().strip()
    if not raw_input:
        print(json.dumps({
            'status': 'Error',
            'message': 'No certificate image data was provided.',
            'student_name': 'N/A',
            'roll_no': 'N/A',
        }))
        return 1

    try:
        image_bytes = base64.b64decode(raw_input)
        result = process_certificate(image_bytes)
        print(json.dumps(result_to_dict(result)))
        return 0
    except Exception as exc:
        print(json.dumps({
            'status': 'Error',
            'message': str(exc),
            'student_name': 'N/A',
            'roll_no': 'N/A',
        }))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())