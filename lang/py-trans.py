#!/usr/bin/python

import sys

# The first argument is the name of the csv file with the translations
# lang-name, English, Spanish, more
# lang-id,   en-us,   es-us,   ...
# id-red,    red,     rojo,    ...
# id-blue,   blue,    azul,    ...

# Load the translations into memory
inName = sys.argv[1]
inFile = open(inName,'r')
inLines = inFile.readlines()
inFile.close()

# Determine the names (ie English) and the ids (ie en-us)
languageNames = inLines[0].split(',')
languageIds = inLines[1].split(',')

# Store all of the words in a big table
# Remove (") because it will messup the JSON
table = []
for i in range(0,len(inLines)):
	table.append(inLines[i].replace('"','').replace('\n','').split(','))

# For each language - create a file of it's phrases
for i in range(1,len(languageIds)):
	outJson = 'var msg = {\n';

	# Add all of the words
	for j in range(0,len(inLines)):
		outJson += '\t"'+table[j][0]+'":"'+table[j][i]+'",\n'

	# Take off the last comma
	outJson = outJson[:-2]
	outJson += '\n};'

	# Create the file for this langues
	outFile = open(languageIds[i]+'.js','w')
	outFile.write(outJson)
	outFile.close()

def make_simple_links(filename):
	# For each language - create a link to set it in the program
	outLinks = ''
	for i in range(1,len(languageIds)):
		outLinks += '<a class="link-button" href="javascript:SetLanguage(\''
		outLinks += languageIds[i].replace('"','')
		outLinks += '\')">'
		outLinks += languageNames[i].replace('"','')
		outLinks += '</a>\n'

	# Write the links to a file
	outFile = open(filename,'w')
	outFile.write(outLinks)
	outFile.close()

# make_simple_links('lang-select-simple.html')

def make_complex_links(filename):
	# For each language - create a link to set it in the program
	outLinks = ''
	for i in range(1,len(languageIds)):
		outLinks += '<a class="link-button" href="javascript:SetLanguage(\''
		outLinks += languageIds[i].replace('"','')
		outLinks += '\')">\n'
		outLinks += '\t<div class="primary">'
		outLinks += languageNames[i].replace('"','')
		outLinks += '</div>\n\t<div class="secondary">'
		outLinks += languageIds[i].replace('"','')
		outLinks += '</div>\n'
		outLinks += '</a>\n'

	# Write the links to a file
	outFile = open(filename,'w')
	outFile.write(outLinks)
	outFile.close()

make_complex_links('lang-select-complex.html')