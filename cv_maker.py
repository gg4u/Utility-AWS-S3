import os, json, math
from wikitools import wiki
from wikitools import api



_LANGUAGE = 'en'
_WIKIAPI = wiki.Wiki("https://"+ _LANGUAGE +".wikipedia.org/w/api.php") 

#arrayIds = '7955|21169538'

def decorateNodes(arrayIds):
	site = wiki.Wiki("https://en.wikipedia.org/w/api.php") 
	params = {
		'action':'query', 
		'pageids':arrayIds,
		'prop' : 'pageimages|extracts',      
		'pithumbsize':'100', 
		'pilimit':'20',
		'exintro': '',
		'explaintext': '',
		'exsentences': '2',
		'exlimit': '20',
		'format' : 'json',
		'continue': ''
		}
	request = api.APIRequest(site, params)
	#
	for result in request.queryGen():
		# hits
		hits = result['query']
	return hits


def grouper(n, iterable):
    it = iter(iterable)
    while True:
       chunk = tuple(itertools.islice(it, n))
       if not chunk:
           return
       yield chunk


path = '/Users/gg4u/Documents/cv/personal_knowledge_map/'
pathOutput = path + 'maps/' 

db = [j for j in os.listdir(path) if j.endswith('.json')]

cvMap = {}
cvMap['all_shortest_paths'] = []
cvMap['nodes'] = []
cvMap['weighted'] = 'True'

nodes = []

for js in db:
	with open(os.path.join(path, js)) as f:
		j = json.load(f)
		#print j['all_shortest_paths']
		for p in j['all_shortest_paths']:
			cvMap['all_shortest_paths'].append(p)
		for n in j['nodes']:
			nodes.append(n)
	cvMap['nodes'] = {v['uid']:v for v in nodes}.values()



chunk = grouper(20, cvMap['nodes'])
source = {}
decorators = []

for i, n in enumerate(chunk):
	arrayIds = ''
	for x in n:
		arrayIds += str(x['source']) + '|'
		source[x['source']] = x['uid']
	print arrayIds[:-1]
	hits = decorateNodes(arrayIds[:-1])
	print len(hits['pages'])
	for j, hit in enumerate(hits['pages']):
		print hit
		if 'extract' in hits['pages'][hit]:
			description =  hits['pages'][hit]['extract']
		else:
			description =  'Topic description not yet available.'
		if 'thumbnail' in hits['pages'][hit]:
			thumbnail = hits['pages'][hit]['thumbnail']
		else:
			thumbnail =  {'source': '', 'height': '', 'width': ''}
		decorators.append({'uid':source[int(hit)],'thumbnail':thumbnail, 'description' : description})
		print 'done batch', i, j
			


cvMap['decorators'] = decorators
x  = nodes[0]
x['proximity'] = 1000
# cvMap['toNode'] = x
# cvMap['fromNode'] = x
cvMap['toNode'] = {
	  "name": "International development", 
	  "proximity": 1000, 
	  "source": 385745, 
	  "uid": "NXne3RODBWOrPDZj"
	}
    
cvMap['fromNode'] =  {
    "name": "Data visualization", 
    "proximity": 1000, 
    "source": 3461736, 
    "uid": "qZpxKrqNp3EaPX3w"
  }

outFileName = '2016-03-06-context-of--a-bit-of-what-I-did-in-life--and--a-bit-of-what-I-care--in-'+str(int(math.floor(len(cvMap['nodes'])/10)*10))+'-topics.json'


json.dump(cvMap, open(pathOutput+'cvMap.json','wb'))
json.dump(cvMap, open(pathOutput+outFileName,'wb'))










