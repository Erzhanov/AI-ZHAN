# -*- coding: utf-8 -*-
"""
Builds an optimized, structured Kazakhstan Clinical Protocols database
from the raw MEDELEMENT JSON and Definitions TXT files.
"""
import json
import re
import os

JSON_PATH = r"C:\Users\Karap\OneDrive\Desktop\CONG\MEDELEMENT\MEDELEMENT_KZ_protocols_2026-09-08.json"
TXT_PATH = r"C:\Users\Karap\OneDrive\Desktop\CONG\MEDELEMENT\MEDELEMENT_KZ_1185_diseases_names_definitions_2026-09-08.txt"
OUTPUT_PATH = r"src\data\kz_protocols.json"

FEMALE_ICD_PREFIXES = [
    'O', 'C51', 'C52', 'C53', 'C54', 'C55', 'C56', 'C57', 'C58',
    'N70', 'N71', 'N72', 'N73', 'N74', 'N75', 'N76', 'N77',
    'N80', 'N81', 'N82', 'N83', 'N84', 'N85', 'N86', 'N87', 'N88', 'N89',
    'N90', 'N91', 'N92', 'N93', 'N94', 'N95', 'N96', 'N97', 'N98'
]

MALE_ICD_PREFIXES = [
    'C60', 'C61', 'C62', 'C63',
    'N40', 'N41', 'N42', 'N43', 'N44', 'N45', 'N46', 'N47', 'N48', 'N49', 'N50', 'N51',
    'Q53', 'Q54', 'Q55'
]

FEMALE_KEYWORDS = [
    'беременн', 'родов', 'послеродов', 'кесарев', 'аборт', 'преэклампси', 'эклампси',
    'токсикоз беременных', 'миома матки', 'эндометр', 'яичник', 'цервицит', 'кольпит',
    'вульвовагинит', 'менопауз', 'климактерическ', 'лактаци', 'мастит лактационн'
]

MALE_KEYWORDS = [
    'простат', 'предстательн', 'полового члена', 'мошонк', 'яичек', 'яичка', 'орхит',
    'эпидидимит', 'варикоцеле', 'гидроцеле', 'фимоз', 'баланопостит', 'баланит', 'эректильн'
]

PEDIATRIC_KEYWORDS = [
    'педиатрия', 'неонатолог', 'у детей', 'новорожден', 'недоношен', 'детск'
]

ADULT_KEYWORDS = [
    'у взрослых', 'взрослых'
]

def load_clean_definitions():
    def_map = {}
    if not os.path.exists(TXT_PATH):
        return def_map
    with open(TXT_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    entries = content.split('====================================================================================================')
    for entry in entries[1:]:
        lines = [l.strip() for l in entry.strip().splitlines() if l.strip()]
        if not lines:
            continue
        first = lines[0]
        m = re.match(r'№\d+\.\s*(.+)', first)
        if not m:
            continue
        name = m.group(1).strip()
        def_text = ''
        if 'АНЫҚТАМА:' in entry:
            parts = entry.split('АНЫҚТАМА:')
            rest = parts[1]
            if 'Дереккөз:' in rest:
                def_text = rest.split('Дереккөз:')[0].strip()
            else:
                def_text = rest.strip()
        def_map[name] = def_text
    return def_map

def detect_gender(name, icd, specs):
    haystack = f"{name} {specs}".lower()
    is_f = False
    is_m = False
    
    for f_code in FEMALE_ICD_PREFIXES:
        if re.search(r'\b' + f_code, icd):
            is_f = True
            break
            
    for m_code in MALE_ICD_PREFIXES:
        if re.search(r'\b' + m_code, icd):
            is_m = True
            break
            
    if any(k in haystack for k in FEMALE_KEYWORDS):
        is_f = True
    if any(k in haystack for k in MALE_KEYWORDS):
        is_m = True
        
    if is_f and is_m:
        return 'both'
    if is_f:
        return 'female'
    if is_m:
        return 'male'
    return 'both'

def detect_age(name, specs):
    haystack = f"{name} {specs}".lower()
    is_child = any(k in haystack for k in PEDIATRIC_KEYWORDS)
    is_adult = any(k in haystack for k in ADULT_KEYWORDS)
    
    if is_child and not is_adult:
        return 'child'
    if is_adult and not is_child:
        return 'adult'
    return 'all'

def clean_extracted_text(text, max_len=600):
    if not text:
        return ""
    # Normalize whitespaces and bullets
    text = re.sub(r'[\r\n]+', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    cleaned = ' '.join(lines)
    if len(cleaned) > max_len:
        cleaned = cleaned[:max_len].rsplit(' ', 1)[0] + '...'
    return cleaned

def extract_section(text, start_patterns, end_patterns, max_len=600):
    start_pos = -1
    for p in start_patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            start_pos = m.end()
            break
    if start_pos == -1:
        return ""
    
    sub = text[start_pos:]
    end_pos = len(sub)
    for ep in end_patterns:
        m = re.search(ep, sub, re.IGNORECASE)
        if m and m.start() < end_pos:
            end_pos = m.start()
            
    val = sub[:end_pos]
    return clean_extracted_text(val, max_len)

def main():
    print("Loading raw protocols...")
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)
    protocols = raw_data['protocols']
    print(f"Total raw protocols: {len(protocols)}")

    def_map = load_clean_definitions()
    print(f"Loaded {len(def_map)} clean definitions")

    indexed = []
    for i, p in enumerate(protocols):
        name = p['name'].strip()
        url = p.get('url', '').strip()
        version = p.get('version', '').strip()
        icd10 = p.get('icd10', '').strip()
        specialties = p.get('specialties', '').strip()
        full_text = p.get('page_text', '')

        gender = detect_gender(name, icd10, specialties)
        age_group = detect_age(name, specialties)

        # Definition
        definition = def_map.get(name, '')
        if not definition:
            definition = extract_section(
                full_text,
                [r'Краткое описание[:\s]*\n?', r'ОПРЕДЕЛЕНИЕ[:\s]*\n?'],
                [r'\n[А-ЯA-Z\s]{4,}:', r'\nКлассификация', r'\nДиагностика'],
                max_len=350
            )
        else:
            definition = clean_extracted_text(definition, 350)

        # Complaints / Symptoms
        complaints = extract_section(
            full_text,
            [r'Жалобы и анамнез[:\s]*\n?', r'Жалобы[:\s]*\n?', r'Клиническая картина[:\s]*\n?', r'Симптомы[:\s]*\n?'],
            [r'\n[А-ЯA-Z\s]{4,}:', r'\nФизикальное обследование', r'\nЛабораторные исследования', r'\nИнструментальные исследования', r'\nДифференциальн'],
            max_len=500
        )
        if not complaints:
            # Fallback to diagnostic criteria
            complaints = extract_section(
                full_text,
                [r'Диагностические критерии[:\s]*\n?', r'Диагностика[:\s]*\n?'],
                [r'\n[А-ЯA-Z\s]{4,}:', r'\nДифференциальный диагноз', r'\nЛабораторные'],
                max_len=400
            )

        # Emergency / Hospitalization
        emergency = extract_section(
            full_text,
            [
                r'Показания для экстренной госпитализации[:\s]*\n?',
                r'Показания к экстренной госпитализации[:\s]*\n?',
                r'Показания для госпитализации[:\s]*\n?',
                r'Госпитализация[:\s]*\n?'
            ],
            [r'\n[А-ЯA-Z\s]{4,}:', r'\nПоказания для плановой', r'\nЛечение', r'\nПрофилактика'],
            max_len=400
        )

        # Treatment
        treatment = extract_section(
            full_text,
            [
                r'Лечение \(амбулатория\)[:\s]*\n?',
                r'Тактика лечения[:\s]*\n?',
                r'Лечение[:\s]*\n?'
            ],
            [r'\n[А-ЯA-Z\s]{4,}:', r'\nЛечение \(стационар\)', r'\nГоспитализация', r'\nМониторинг'],
            max_len=400
        )

        indexed.append({
            'id': i + 1,
            'name': name,
            'url': url,
            'version': version,
            'icd10': icd10,
            'specialties': specialties,
            'gender': gender,
            'age': age_group,
            'description': definition,
            'complaints': complaints,
            'emergency': emergency,
            'treatment': treatment
        })

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(indexed, f, ensure_ascii=False, indent=1)

    file_size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"Successfully generated {OUTPUT_PATH}!")
    print(f"Total protocols: {len(indexed)}")
    print(f"File size: {file_size_mb:.2f} MB")

if __name__ == "__main__":
    main()
