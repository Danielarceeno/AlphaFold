const DISEASES = {
  "Esophageal cancer": "Câncer de esôfago",
  "Li-Fraumeni syndrome": "Síndrome de Li-Fraumeni",
  "Squamous cell carcinoma of the head and neck":
    "Carcinoma de células escamosas de cabeça e pescoço",
  "Lung cancer": "Câncer de pulmão",
  "Papilloma of choroid plexus": "Papiloma do plexo coroide",
  "Adrenocortical carcinoma": "Carcinoma adrenocortical",
  "Basal cell carcinoma 7": "Carcinoma basocelular 7",
  "Bone marrow failure syndrome 5": "Síndrome de falência da medula óssea 5",
  Hyperproinsulinemia: "Hiperproinsulinemia",
  "Type 1 diabetes mellitus 2": "Diabetes mellitus tipo 1 (subtipo 2)",
  "Diabetes mellitus, permanent neonatal, 4":
    "Diabetes mellitus neonatal permanente 4",
  "Maturity-onset diabetes of the young 10":
    "Diabetes do jovem de início na maturidade 10",
  "Heinz body anemias": "Anemias com corpos de Heinz",
  "Beta-thalassemia": "Beta-talassemia",
  "Sickle cell disease": "Doença falciforme",
  "Beta-thalassemia, dominant, inclusion body type":
    "Beta-talassemia dominante, tipo com corpos de inclusão",
  "Myopathy, sarcoplasmic body": "Miopatia de corpos sarcoplasmáticos",
  "Alpha-thalassemia": "Alfa-talassemia",
  "Hemoglobin H disease": "Doença da hemoglobina H",
  "Hyperlipoproteinemia 3": "Hiperlipoproteinemia tipo 3",
  "Alzheimer disease 1": "Doença de Alzheimer 1",
  "Alzheimer disease 2": "Doença de Alzheimer 2",
  "Sea-blue histiocyte disease": "Doença do histiócito azul-marinho",
  "Lipoprotein glomerulopathy": "Glomerulopatia lipoproteica",
  "Breast cancer": "Câncer de mama",
  "Breast-ovarian cancer, familial, 1": "Câncer de mama e ovário familiar 1",
  "Breast-ovarian cancer, familial, 2": "Câncer de mama e ovário familiar 2",
  "Ovarian cancer": "Câncer de ovário",
  "Pancreatic cancer 2": "Câncer de pâncreas 2",
  "Pancreatic cancer 4": "Câncer de pâncreas 4",
  "Fanconi anemia, complementation group S":
    "Anemia de Fanconi, grupo de complementação S",
  "Fanconi anemia complementation group D1":
    "Anemia de Fanconi, grupo de complementação D1",
  "Neonatal nephrocutaneous inflammatory syndrome":
    "Síndrome inflamatória nefrocutânea neonatal",
  "Costello syndrome": "Síndrome de Costello",
  "Congenital myopathy with excess of muscle spindles":
    "Miopatia congênita com excesso de fusos musculares",
  "Thyroid cancer, non-medullary, 2": "Câncer de tireoide não medular 2",
  "Bladder cancer": "Câncer de bexiga",
  "Schimmelpenning-Feuerstein-Mims syndrome":
    "Síndrome de Schimmelpenning-Feuerstein-Mims",
  "Frontotemporal dementia 1": "Demência frontotemporal 1",
  "Pick disease of the brain": "Doença de Pick cerebral",
  "Progressive supranuclear palsy 1": "Paralisia supranuclear progressiva 1",
  "Parkinson-dementia syndrome": "Síndrome de Parkinson-demência",
  "Cerebral amyloid angiopathy, APP-related":
    "Angiopatia amiloide cerebral relacionada à APP",
  "Huntington disease": "Doença de Huntington",
  "Lopes-Maciel-Rodan syndrome": "Síndrome de Lopes-Maciel-Rodan",
  "Marfan syndrome": "Síndrome de Marfan",
  "Ectopia lentis 1, isolated, autosomal dominant":
    "Ectopia do cristalino 1, isolada, autossômica dominante",
  "Weill-Marchesani syndrome 2": "Síndrome de Weill-Marchesani 2",
  "Overlap connective tissue disease":
    "Doença do tecido conjuntivo de sobreposição",
  "Stiff skin syndrome": "Síndrome da pele rígida",
  "Geleophysic dysplasia 2": "Displasia geleofísica 2",
  "Acromicric dysplasia": "Displasia acromicrica",
  "Marfanoid-progeroid-lipodystrophy syndrome":
    "Síndrome marfanoide-progeroide-lipodistrofia",
  "Gaucher disease": "Doença de Gaucher",
  "Gaucher disease 1": "Doença de Gaucher tipo 1",
  "Gaucher disease 2": "Doença de Gaucher tipo 2",
  "Gaucher disease 3": "Doença de Gaucher tipo 3",
  "Gaucher disease 3C": "Doença de Gaucher tipo 3C",
  "Gaucher disease perinatal lethal": "Doença de Gaucher perinatal letal",
  "Parkinson disease": "Doença de Parkinson",
  "Hirschsprung disease 1": "Doença de Hirschsprung 1",
  "Medullary thyroid carcinoma": "Carcinoma medular da tireoide",
  "Multiple neoplasia 2A": "Neoplasia endócrina múltipla 2A",
  "Multiple neoplasia 2B": "Neoplasia endócrina múltipla 2B",
  Pheochromocytoma: "Feocromocitoma",
  "Glioma 3": "Glioma 3",
  Medulloblastoma: "Meduloblastoma",
  "Generalized epilepsy with febrile seizures plus 2":
    "Epilepsia generalizada com crises febris plus 2",
  "Dravet syndrome": "Síndrome de Dravet",
  "Intractable childhood epilepsy with generalized tonic-clonic seizures":
    "Epilepsia infantil intratável com crises tônico-clônicas generalizadas",
  "Migraine, familial hemiplegic, 3": "Enxaqueca hemiplégica familiar 3",
  "Febrile seizures, familial, 3A": "Convulsões febris familiares 3A",
  "Developmental and epileptic encephalopathy 6B":
    "Encefalopatia epiléptica e do desenvolvimento 6B",
};

// Observações de variantes (chaves em minúsculas) -> português
const VARIANT_NOTES = {
  "somatic mutation": "Mutação somática",
  "germline mutation": "Mutação germinativa",
  "germline mutation and in sporadic cancers":
    "Mutação germinativa e em cânceres esporádicos",
  "germline mutation and in a sporadic cancer":
    "Mutação germinativa e em um câncer esporádico",
  "in sporadic cancers": "Em cânceres esporádicos",
  "in a sporadic cancer": "Em um câncer esporádico",
  "in a familial cancer not matching lfs":
    "Em um câncer familiar que não se enquadra na síndrome de Li-Fraumeni",
  "in a brain tumor with no family history":
    "Em um tumor cerebral sem histórico familiar",
  "in ovarian cancer": "Em câncer de ovário",
  "in one patient with esophageal carcinoma":
    "Em um paciente com carcinoma de esôfago",
  "in a patient with renal agenesis": "Em paciente com agenesia renal",
  "found in a lung cancer sample": "Encontrada em amostra de câncer de pulmão",
  "found in a patient with marfan-like syndrome":
    "Encontrada em paciente com síndrome semelhante à de Marfan",
  "found in a patient with an unclassified form of epilepsy":
    "Encontrada em paciente com forma não classificada de epilepsia",
  "also found in a patient with parkinson disease":
    "Também encontrada em paciente com doença de Parkinson",
  "familial form": "Forma familiar",
  "sporadic form": "Forma esporádica",
  "familial and sporadic forms": "Formas familiar e esporádica",
  "uncertain significance": "Significado incerto",
  pathogenic: "Patogênica",
  "likely pathogenic": "Provavelmente patogênica",
  benign: "Benigna",
  "likely benign": "Provavelmente benigna",
  mild: "Leve",
  severe: "Grave",
  "severe neonatal": "Forma neonatal grave",
  "borderline phenotype": "Fenótipo limítrofe",
  unstable: "Instável",
  "slightly unstable": "Levemente instável",
  "requires 2 nucleotide substitutions": "Requer 2 substituições de nucleotídeos",
  "o(2) affinity up": "Maior afinidade pelo oxigênio",
  "o(2) affinity down": "Menor afinidade pelo oxigênio",
  "causes alpha-thalassemia": "Causa alfa-talassemia",
  "functionally neutral in vitro": "Funcionalmente neutra in vitro",
  "functionally impaired in vitro": "Funcionalmente comprometida in vitro",
  "increases susceptibility to proteolytic degradation":
    "Aumenta a suscetibilidade à degradação proteolítica",
  "decreased glucosylceramidase activity":
    "Atividade da glicosilceramidase reduzida",
  "severely decreased glucosylceramidase activity":
    "Atividade da glicosilceramidase severamente reduzida",
  "very low glucosylceramidase activity":
    "Atividade da glicosilceramidase muito baixa",
  "loss of glucosylceramidase activity":
    "Perda da atividade da glicosilceramidase",
  "decreased glucosylceramide catabolic process":
    "Catabolismo da glicosilceramida reduzido",
  "loss of glucosylceramide catabolic process":
    "Perda do catabolismo da glicosilceramida",
  "reduced homology-directed repair activity":
    "Atividade de reparo por recombinação homóloga reduzida",
  "decreased homology-directed repair activity":
    "Atividade de reparo por recombinação homóloga reduzida",
  "no effect on homology-directed repair activity":
    "Sem efeito na atividade de reparo por recombinação homóloga",
  "more sensitive to gefitinib than wild-type":
    "Mais sensível ao gefitinibe que a proteína normal",
  "does not induce snai1 degradation": "Não induz a degradação de SNAI1",
  "results in a non-functional channel": "Resulta em canal não funcional",
  "changed voltage-gated sodium channel activity":
    "Atividade alterada do canal de sódio dependente de voltagem",
  "decreased binding to ldl receptor": "Menor ligação ao receptor de LDL",
  "increased amyloid-beta protein 42/40 ratio":
    "Razão amiloide-beta 42/40 aumentada",
  "prevents secretion into the extracellular matrix":
    "Impede a secreção para a matriz extracelular",
  "prevents phosphorylation in response to gdnf":
    "Impede a fosforilação em resposta ao GDNF",
  "constitutively activated kinase with higher levels of basal autophosphorylation":
    "Quinase constitutivamente ativada, com níveis basais mais altos de autofosforilação",
};

module.exports = { DISEASES, VARIANT_NOTES };
