function is_number(x){
	return (! isNaN(x));
}
function is_regexp(x){
	return x instanceof RegExp;
}
function is_array(x){
	return x instanceof Array;
}

function template(template_id,replacements){
	var html = document.getElementById(template_id).innerHTML;

	// replace all of the allowed stuff...
	var prop; var arr_match; var regexp; var i; var l; var lines; var full_line; var clean_line; var name=''; var line='';
	for( prop in replacements ){
		if( replacements.hasOwnProperty(prop) ){

			// When replacing arrays: The array'ed template
			// fragment is enclosed in [...]
			// I use these for select/option inputs
			if( is_array(replacements[prop]) ){

				// Find the array area then create multiple copies
				// of it for the number of items we have

				regexp = new RegExp('\\[([\\s\\S]+?'+'%'+prop+'%'+'[\\s\\S]+?)\\]','g');
				arr_match = regexp.exec(html);
				full_line = arr_match[0];
				clean_line = arr_match[1];
				lines = '';
				l = replacements[prop].length;
				
				for( i=0; i<l; i+=1 ){
					// For URL parms I let `|` separate synonyms
					// For select/options I only show the first one
					if( ! replacements[prop][i] ){ continue; } // IE bug
					name = replacements[prop][i].split('|')[0];
					line = clean_line.replace('%'+prop+'%',name);
					
					// Make sure we have the correct default options
					if( name === replacements.value ){
						line = line.replace('<option>','<option selected="selected">');
					}
					lines += line;
				}

				html = html.replace(full_line,lines);
			}else{
				// This the regular one, %value% or %?value%
				html = html.replace(new RegExp('%\\??'+prop+'%','g'), replacements[prop]);
			}
		}
	}

	// Remove all of the optional stuff that has been left out
	// optional stuff has a `?` after the 1st `%` ie %?name% is optional
	html = html.replace(new RegExp('[^ ]+?'+'%'+'\\?[^ ]+'+'%'+'[^ ]+?','g'), '');
	
	return html;
}

function make_template_form(template_prefix,options){
	var html = '';
	var i, l = options.length;
	for( i=0; i<l; i+=1 ){
		html += template(template_prefix + options[i].type, options[i]);
	}
	return html;
}

function make_template_section(template_prefix,section){
	var form_html = make_template_form( template_prefix, section.form );
	var html = template(template_prefix+'section', { title: section.title, content: form_html });
	return html;
}

function make_template_sections(template_prefix,sections){
	var html = '';
	var i, l = sections.length;
	for( i=0; i<l; i+=1 ){
		html += make_template_section(template_prefix,sections[i]);
	}
	return html;
}

function read_url_parms(options,results){
	/// Parses the URL for parameters and returns an array of key-value pairs
	// An exmaple url: http://example.com/index.htm?key1=val1&key2=val2

	// URL parameters begin after '?' in the URL.
	// If it's not there, just return the defaults
	var startLocation = window.location.href.indexOf('?');
	var parmString, varStrings, variables, i, l, tmp;
	if( startLocation !== -1 ){ 
		parmString = window.location.href.slice(startLocation + 1);
	
		// Each key/value pair is separated by an '&'.
		varStrings = parmString.split('&');
	
		// We need to iterate over each key/value string.
		l = varStrings.length;
		variables = {};
		for( i=0; i<l; i+=1 ){
	
			// Key/value strings have the form: key=value
			tmp = varStrings[i].split('=');
	
			// We need to unescape the strings because they be encoded as follows:
			// "hello world" -> hello+world
			// or certain charactes are encoded as their ascii value: %20 %da
			// We also convert the key to lower case so the program can always
			// access via the lower case key.
			results[unescape(tmp[0]).toLowerCase()] = unescape(tmp[1]);
		}
	}

	// Add the stuff we're missing and sanitize all inputs
	var id, value, j, k, opts, isOk;
	l = options.length;
	for( i=0; i<l; i+=1 ){
		id = options[i].id;

		// Use the default unless the user has supplied a value
		value = options[i].value;
		if( results.hasOwnProperty(id) ){
			value = results[id];
		}

		// Handle yes/no checkboxes specially
		if( options[i].type === 'checkbox' ){
			tmp = (''+value).toLowerCase();
			if( value === 'yes' || value === 'y' || value === '1' || value === 'on' || value === '' ){
				value = true;
			}
			if( value === 'no' || value === 'no' || value === '0' || value === 'off' ){
				value = false;
			}
		}

		// Force select options to the dominant one
		if( options[i].type === 'select' ){

			j = options[i].options.length;
			isOk = 0;
			while( j-- ){
				opts = options[i].options[j].split('|');
				k = opts.length;
				while( k-- ){
					if( opts[k] === value ){
						value = opts[0];
						k = 0; // break the loop
						j = 0; // break the loop
						isOk = 1;
					}
				}
			}

			// If it wasn't a valid selection option, set the default
			if( ! isOk ){
				value = options[i].value;
			}
		}
		
		// Convert the value if a conversion function was provided
		// otherwise, just use the value
		if( options[i].convert ){
			results[id] = options[i].convert(value);
		}else{
			results[id] = value;
		}
		
	}

	return results;
}

function read_form_data(options,results){

	var dom_id, prop, dom, value;
	var i, l = options.length;
	for( i=0; i<l; i+=1 ){

		// Find the corresponding dom node, based on the id
		prop = options[i].id;
		dom_id = 'in-'+prop;
		dom = document.getElementById(dom_id);

		// Get the user's input or use the default value
		value = options[i].value;
		if( dom.value !== '' ){
			value = dom.value;
		}

		// The `value` attribute of a checkbox has no meaning
		// we need to check the `checked` attribute
		if( dom.type === 'checkbox' ){
			value = ( !! dom.checked );
		}

		// Convert the value if a conversion function was provided
		// otherwise, just use the value
		if( options[i].convert ){
			results[prop] = options[i].convert(value);
		}else{
			results[prop] = value;
		}

	}

	return results;
}

function read_form_data_sections(sections){
	var results = {};

	var i, l= sections.length;
	for( i=0; i<l; i+=1 ){
		results = read_form_data(sections[i].form,results);
	}

	return results;
}
function read_url_parms_sections(sections){
	var results = {};

	var i, l= sections.length;
	for( i=0; i<l; i+=1 ){
		results = read_url_parms(sections[i].form,results);
	}

	return results;
}