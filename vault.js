function find() {
    client = new RiakClient();
    client.bucket('passwords', function(b){get_object(b);});
}

function save(){
    client = new RiakClient();
    client.bucket('passwords', function(b){get_or_new_object(b);});
    $('#errors').text('Password stored');
}

function get_or_new_object(bucket){
    bucket.get_or_new($('input#key').val(), function(status, o){save_object(o);});
}

function save_object(object){
    encrypted = GibberishAES.enc($('input#value').val(), $('input#secret').val());
    object.body = encrypted;
    object.contentType = 'text/plain';
    object.store();
    $('input#value').val(encrypted);
}

function get_object(bucket){
    bucket.get($('input#key').val(), function(s,o){get_value(o);});
}

function get_value(object){
    try {
        decrypted = GibberishAES.dec(object.body, $('input#secret').val());
        $('input#value').val(decrypted);
        $('#errors').text("");
    }
    catch(e) {
        $('#errors').text("Error decrypting, passphrase may be incorrect");
        $('input#value').val("");
    }
}

//---------------------BEGIN NEW STUFF
function fetch(key){
    client = new RiakClient();
    client.bucket('passwords', function(bucket){
        bucket.get(key, function(s,o){
            try {
                decrypted = GibberishAES.dec(o.body, $('input#secret').val());
                $('input#value').val(decrypted);
                $('#errors').text("");
            }
            catch(e) {
                $('#errors').text("Error decrypting, passphrase may be incorrect");
                $('input#value').val("");
            }
        });
    });
}

function list_keys(){
    client = new RiakClient();
    var bucket = new RiakBucket('passwords', client);
    bucket.keys(function(keys){
        var data = {'keys': keys.sort()};
        var template = [['div', {'id':'passphrase'},
                            ['input', {'type':'button', 'value':'New Item', 'onclick':'new_item();'}],
                            ['table',
                                ['tr',
                                    ['td', 'Passphrase:'],
                                    ['td',
                                        ['input', {'type':'password', 'id':'secret'}]]]]],
                        ['div',
                            data.keys.map(function(text){
                                return ['p', ['a', {'href': '#/fetch/'+text}, text]];
                            })
                        ]];
        $('#content').html(microjungle(template));
    });
}

function new_item(){
    var template = [['table',
                    ['tr',
                        ['td', 'Account:'],
                        ['td', ['input', {'type':'text', 'id':'key'}]]]
                    ['tr',
                        ['td', 'Passphrase:'],
                        ['td', ['input', {'type':'password', 'id':'secret'}]]],
                    ['tr',
                        ['td', 'Username:'],
                        ['td', ['input',{'type':'text', 'id':'username'}]]]
                    ]];
    $('#content').html(microjungle(template));


//       Account:' <input type="text" id="key" /><br />
//                Passphrase: <input type="password" id="enc_secret" /><br />
//                Username: <input type="text" id="username" /><br/>
//                Password: <input type="text" id="password"><br />
//                Notes: <textarea rows=3 cols=20 id="notes"></textarea><br />
//                <input type="button" value="Save" onclick="save();"/>
}

$(function() {
    var routes = {
        '/list': list_keys,
        '/fetch': {
            '/(\\w+)': {
                on: function(key){fetch(key);}
            }
        }
    };
    var router = Router(routes).init();
    list_keys();
});