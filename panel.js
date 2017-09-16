// popup script

var setBodyEmpty = () => {
    var textnode = document.createTextNode('There is no cache here!');
    document.body.textContent = '';
    document.body.style.padding = '20px';
    document.body.appendChild(textnode);
};

window.onload = () => {
    var whole_data = null;
	browser.runtime.sendMessage({
		behavior: 'load'
	}).then( ( resObj => {
		if (!(resObj && resObj.data)) return false;
        whole_data = resObj.data;
        if (Object.keys(whole_data).length <= 2) {
            // Note: there are 2 default keys: version, setting
            setBodyEmpty();
            return false;
        }

		var selector   = document.querySelector('#cache_seletor');
		var show_cache = document.querySelector('#show_cache');
		var copy_btn   = document.querySelector('#copy_btn');
		var delete_btn = document.querySelector('#delete_btn');

		var escapeHTML = str => str.toString().replace(/[&"'<>]/g, m => ({
			"&": "&amp;",
			'"': "&quot;",
			"'": "&#39;",
			"<": "&lt;",
			">": "&gt;"
		})[m]);

		var selectText = dom  => {
			if (document.selection) {
				var range = document.body.createTextRange();
				range.moveToElementText(dom);
				range.select();
			}
			else if (window.getSelection) {
				var range = document.createRange();
				range.selectNode(dom);
				window.getSelection().addRange(range);
			}
		};

		var showPreview = (isWYSIWYG, val) => {
			// val is used to show preview of WYSIWYG,
			// so it should not be escaped.
			//
			// for security issues, I will remove all <script> & </script> tag

			if (isWYSIWYG) {
				show_cache.type = 'WYSIWYG';
				val = val.replace(/<script.*>.*<\/script.*>/g, '');
				show_cache.innerHTML = val;
			}
			else {
				show_cache.type = 'txt';
				var text = document.createTextNode(val);
				var textarea = document.createElement('textarea');
                textarea.appendChild(text);
                show_cache.innerHTML = '';
				show_cache.appendChild(textarea);
			}
		};

        var tmp_array = [];
		for (var key in whole_data) {
            if (!whole_data[key] || key == 'version' || key == 'setting') continue;
		    var tmp_data = whole_data[key];
		    tmp_data.key = key;
		    tmp_array.push(tmp_data);
		}

        tmp_array.reverse().forEach(one_data => {
            var type = one_data.type;
            var cache = one_data.val;

            var text = document.createTextNode(one_data.key);
            var option = document.createElement('option');
            option.appendChild(text);
            option.value = one_data.key;
            selector.appendChild(option);

            if (show_cache.innerHTML == '')
                showPreview(type == 'WYSIWYG', cache);

            if (!document.querySelector('option')) {
                setBodyEmpty();
            }
        });

		selector.addEventListener('change', e => {
			var key = e.target.value;
			var cache = whole_data[key].val;
			var isWYSIWYG = whole_data[key].type == 'WYSIWYG';

			showPreview(isWYSIWYG, cache);
		});

		copy_btn.addEventListener('click', () => {
			if (show_cache.type == 'WYSIWYG') {
				selectText(show_cache);
			}
			else {
				document.querySelector("textarea").select();
			}
			document.execCommand("Copy");
			// alert('You got it, now put your cache anyway!');
		});


        delete_all_btn.addEventListener('click', () => {
            browser.runtime.sendMessage({
                behavior: 'clear'
            }).then(res => {
                if (res.msg == 'done') {
                    setBodyEmpty();
                }
            });
        });

        delete_btn.addEventListener('click', () => {
            browser.runtime.sendMessage({
                behavior: 'delete',
                id: selector.value
            }).then( res => {
                whole_data = res.data;
                selector.querySelector(`[value="${res.deleted}"]`).remove();

                var key = selector.value;

                if (!whole_data[key]) {
                    setBodyEmpty();
                    return false;
                }

                var cache = whole_data[key].val;
                var isWYSIWYG = whole_data[key].type == 'WYSIWYG';

                showPreview(isWYSIWYG, cache);
            });
        });
	}));
}
