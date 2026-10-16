// -*- coding: utf-8 -*-
/**
 * Builds the Three Medical Knowledge Bases for AIZHAN:
 * 1. symptom_dictionary.json (Словарь терминов с народными вариантами и negations)
 * 2. symptom_maps.json (Карта симптомов с весами, порогами и подтверждающими анализами)
 * 3. kz_protocols.json (Протоколы МЗ РК с нарезкой на секции: жалобы, лечение, показания, противопоказания)
 *
 * Source: all_1187_protocols.json / all_1187_protocols.jsonl
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const rawDir = path.join(projectRoot, 'src', 'data', 'raw');
const targetDir = path.join(projectRoot, 'src', 'data');

const desktopJson = 'C:/Users/Karap/OneDrive/Desktop/all_1187_protocols.json';
const desktopJsonl = 'C:/Users/Karap/OneDrive/Desktop/all_1187_protocols.jsonl';

function main() {
  console.log('Ensuring raw directory...');
  if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
  }

  // Copy if available on Desktop
  if (fs.existsSync(desktopJson)) {
    fs.copyFileSync(desktopJson, path.join(rawDir, 'all_1187_protocols.json'));
    console.log('Copied all_1187_protocols.json to raw directory');
  }
  if (fs.existsSync(desktopJsonl)) {
    fs.copyFileSync(desktopJsonl, path.join(rawDir, 'all_1187_protocols.jsonl'));
    console.log('Copied all_1187_protocols.jsonl to raw directory');
  }

  const jsonSource = fs.existsSync(path.join(rawDir, 'all_1187_protocols.json'))
    ? path.join(rawDir, 'all_1187_protocols.json')
    : desktopJson;

  console.log('Reading raw dataset from', jsonSource);
  const rawData = JSON.parse(fs.readFileSync(jsonSource, 'utf-8'));

  // 1. Symptom Dictionary
  const symptoms = rawData.symptoms || [];
  fs.writeFileSync(
    path.join(targetDir, 'symptom_dictionary.json'),
    JSON.stringify(symptoms, null, 1),
    'utf-8'
  );
  console.log(`Saved symptom_dictionary.json (${symptoms.length} entries)`);

  // 2. Symptom Maps
  const symptomMaps = rawData.symptom_maps || [];
  fs.writeFileSync(
    path.join(targetDir, 'symptom_maps.json'),
    JSON.stringify(symptomMaps, null, 1),
    'utf-8'
  );
  console.log(`Saved symptom_maps.json (${symptomMaps.length} entries)`);

  // 3. KZ Protocols (Enriched with protocol_id and confirm_tests)
  const existingProtocolsPath = path.join(targetDir, 'kz_protocols.json');
  let baseProtocols = [];
  if (fs.existsSync(existingProtocolsPath)) {
    baseProtocols = JSON.parse(fs.readFileSync(existingProtocolsPath, 'utf-8'));
  }

  const mapByMedId = new Map();
  for (const sm of symptomMaps) {
    const m = (sm.source_url || '').match(/\/(\d+)\/?$/);
    const id = m ? m[1] : sm.protocol_id.split('_').pop();
    if (id) mapByMedId.set(id, sm);
  }

  const enrichedProtocols = baseProtocols.map(p => {
    const m = (p.url || '').match(/\/(\d+)\/?$/);
    const id = m ? m[1] : String(p.id);
    const sm = mapByMedId.get(id);
    return {
      id: p.id,
      protocol_id: sm ? sm.protocol_id : `MZRK_${p.id}`,
      name: p.name,
      url: p.url,
      version: p.version,
      icd10: p.icd10,
      specialties: p.specialties,
      gender: p.gender,
      age: p.age,
      description: p.description,
      complaints: p.complaints,
      emergency: p.emergency,
      treatment: p.treatment,
      confirm_tests: sm ? (sm.confirm_tests || []) : (p.confirm_tests || [])
    };
  });

  fs.writeFileSync(
    existingProtocolsPath,
    JSON.stringify(enrichedProtocols, null, 1),
    'utf-8'
  );
  console.log(`Saved kz_protocols.json (${enrichedProtocols.length} entries)`);
  console.log('Three Knowledge Bases successfully compiled!');
}

main();
