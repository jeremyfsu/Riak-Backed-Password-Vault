function list_keys(){
    client = new RiakClient();
    var bucket = new RiakBucket(window.bucket, client);
    bucket.keys(function(keys){
        var data = {'keys': keys.sort()};
        var template = [['table',
                            data.keys.map(function(text){
                                return ['tr',
                                    ['td',
                                        ['div', {'class':'account'},
                                            ['a', {'href': '#/fetch/'+text}, unescape(text)]
                                        ]
                                    ],
                                    ['td',
                                        ['a', {'href': '/riak/passwords/'+text, 'class':'delete', 'id':text}, 'X']
                                    ]
                                ]
                            })
                        ]];
        template.push(['a', {'href':'#/new', 'class':'default'}, 'New Account']);
        $('#content').html(microjungle(template));
        $('#errors').text('');
    });
}

function fetch(key){
    client = new RiakClient();
    client.bucket(window.bucket, function(bucket){
        bucket.get(key, function(s,o){
            try {
                decrypted = GibberishAES.dec(o.body, $('input#secret').val());
                record = JSON.parse(decrypted);
                var template = [[
                    ['input', {'type':'hidden', 'id':'key', 'value':key}],
                    ['table',
                        ['tr',
                            ['td', 'Account:'],
                            ['td', key]
                        ],
                        ['tr',
                            ['td', 'Username:'],
                            ['td', ['input',{'type':'text', 'id':'username', 'value':record.username}]]
                        ],
                        ['tr',
                            ['td', 'Password:'],
                            ['td', ['input',{'type':'text', 'id':'password', 'value':record.password}]]
                        ],
                        ['tr',
                            ['td', 'Notes:'],
                            ['td', ['textarea', {'rows':3, 'cols':20, 'id':'notes'}, record.notes]]
                        ],
                        ['tr',
                            ['td', ['input', {'type':'button', 'value':'Store', 'onclick':'store();'}]]
                        ]
                    ],
                    ['a', {'href':'#/list_keys'}, 'List Records']
                ]];
                $('#content').html(microjungle(template));
                $('#errors').text('');

            }
            catch(e) {
                window.location = '#/error/' + escape(e);
            }
        });
    });
}

function new_item(){
    var template = [['table',
                        ['tr',
                            ['td', 'Account:'],
                            ['td', ['input', {'type':'text', 'id':'key'}]]],
                        ['tr',
                            ['td', 'Username:'],
                            ['td', ['input',{'type':'text', 'id':'username'}]]],
                        ['tr',
                            ['td', 'Password:'],
                            ['td', ['input',{'type':'text', 'id':'password'}]]],
                        ['tr',
                            ['td', 'Notes:'],
                            ['td', ['textarea', {'rows':3, 'cols':20, 'id':'notes'}]]],
                        ['tr',
                            ['td', ['input', {'type':'button', 'value':'Store', 'onclick':'store();'}]]],
                        ['tr',
                            ['td', ['a', {'href':'#/list_keys'}, 'List Accounts']]]
    ]];
    $('#content').html(microjungle(template));
    $('#errors').text('');
}

function store(){
    client = new RiakClient();
    client.bucket(window.bucket, function(bucket){
        bucket.get_or_new($('input#key').val(), function(status, object){
            record = {
                'username':$('input#username').val(),
                'password':$('input#password').val(),
                'notes':$('textarea#notes').val()
            };
            encrypted = GibberishAES.enc(JSON.stringify(record), $('input#secret').val());
            object.body = encrypted;
            object.contentType = 'text/plain';
            object.store();
        });
    });

    window.location = '#/error/' + escape('Account info encrypted and stored');
}

//This function was borrowed from Rekon https://github.com/basho/rekon
//I thought it was pretty darn slick plus it taught me some JQuery tricks
$('a.delete').live('click', function(e){
    var link = this;
    e.preventDefault();
    if(!confirm("Are you sure you want to delete the account\n" + $(link).attr('id') + '?')) { return; }

    $.ajax({
        type: 'DELETE',
        url: $(link).attr('href')
    }).success(function(){
        $(link).closest('tr').remove();
    }).error(function(){
        alert('There was an error deleting this object from Riak.');
    });
});

function error(msg){
    $('#errors').text(unescape(msg));
}

$(function() {
    window.bucket = 'passwords';
    var routes = {
        '/fetch': {
            '/(.*)': {
                on: function(key){fetch(key);}
            }
        },
        '/list_keys':list_keys,
        '/new':new_item,
        '/error': {
            '/(.*)' : {
                on: function(msg){error(msg);}
            }
        }
    };
    var router = Router(routes).init();
    window.location = '#/list_keys';
});