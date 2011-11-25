function list_keys(bucket){
    client = new RiakClient();
    var bucket = new RiakBucket(bucket, client);
    bucket.keys(function(keys){
        var data = {'keys': keys.sort()};
        var template = [['div',
                            data.keys.map(function(text){
                                return ['table',
                                    ['tr',
                                        ['td', ['a', {'href': '#/fetch/'+text}, unescape(text)]],
                                        ['td', ['a', {'href': '/riak/'+bucket+'/'+text, 'class':'delete'}, 'X']]
                                    ]
                                ];
                            })
                        ],
                        ['div', {'class':'new'},
                            ['a', {'href':'#/new'}, 'New Account']
                        ]
        ];
        $('#content').html(microjungle(template));
        $('#errors').text('');

    });
}

function fetch(bucket, key){
    client = new RiakClient();
    client.bucket(bucket, function(bucket){
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
                            ['td', ['input', {'type':'button', 'value':'Store', 'onclick':'store('+bucket+');'}]]
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

function new_item(bucket){
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
                            ['td', ['input', {'type':'button', 'value':'Store', 'onclick':'store('+bucket+');'}]]],
                        ['tr',
                            ['td', ['a', {'href':'#/list_keys'}, 'Cancel']]]
    ]];
    $('#content').html(microjungle(template));
    $('#errors').text('');

}

function store(bucket){
    client = new RiakClient();
    client.bucket(bucket, function(bucket){
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
            $('#errors').text('Account info encrypted and stored');
        });
    });

    window.location = '#/list_keys';
}

//This function was borrowed from Rekon https://github.com/basho/rekon
//I thought it was pretty darn slick plus it taught me some JQuery tricks
$('a.delete').live('click', function(e){
    var link = this;
    e.preventDefault();
    if(!confirm("Are you sure you want to delete:\n" + $(link).attr('href'))) { return; }

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
    var routes = {
        '/fetch/?([^\/]*)\/([^\/]*)/?': {
            on: function(bucket,key){fetch(bucket, key);}
        },
        '/list_keys': {
            '/(\\w+)': {
                on: function(bucket){list_keys(bucket);}
            }
        },
        '/new': {
            '/(\\w+)': {
                on: function(bucket){new_item(bucket);}
            }
        },
        '/error': {
            '/(.*)' : {
                on: function(msg){error(msg);}
            }
        }
    };
    var router = Router(routes).init();
    window.location = '#/list_keys';
});