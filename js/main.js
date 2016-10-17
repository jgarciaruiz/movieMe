document.getElementById('searchinput').onkeydown = function(e){
   if(e.keyCode == 13){
        var search = document.getElementById("searchinput").value;
        var searchEncoded = encodeURIComponent(search);
        console.info("Searching movie:", search);

        movieMe.search.getMovie(
            searchEncoded,
            function(data) {
                console.info(data);
            },
            function(error) {
                console.log('error: '+error);
            }
        );

        e.preventDefault();
   }
};


var movieMe = {};

//SETTINGS
movieMe.settings = {
    apiKey: "",
    baseURI: "http://api.themoviedb.org/3/",
    posters_uri: "http://image.tmdb.org/t/p/", //supported -> "w92", "w154", "w185", "w342", "w500", "w780"
    timeout: 15000
};

//ACTIONS
movieMe.actions = {
    argsValidate: function(fnArguments, totalArgsRequired) {
        'use strict';

        if (fnArguments.length !== totalArgsRequired) {
            console.warn("This method requires " + totalArgsRequired + " arguments. You're sending " + fnArguments.length);
        }
    },
    callbacksValidate: function(thecalls) {
        'use strict';
        
        //check for functions
        //console.log( typeof thecalls[0] );
        //console.log( typeof thecalls[1] );

        if (typeof thecalls[0] !== "function" || typeof thecalls[1] !== "function") {
            console.warn("The params \"callback\" and \"errorCallback\" must be functions");
        }
    },
    queryMovie: function(options) {
        'use strict';

        var myOptions, query, option;
        var fetch = {
            query: options
        };

        myOptions = fetch;
        query = "?api_key=" + movieMe.settings.apiKey+"&language=es"+"&append_to_response=videos&language=es";

        //obtener array con propiedades del objeto myOptions
        if (Object.keys(myOptions).length > 0) {
            for (option in myOptions) {
                //comprobar propiedades en el objeto                
                if (myOptions.hasOwnProperty(option) && option !== "id" && option !== "body") {
                    //URL a construir: http://api.themoviedb.org/3/search/movie?query=inception&settings{APIKEY+"&language=es"}&append_to_response=videos
                    query = query + "&" + option + "=" + myOptions[option];
                }
            }
        }

        return query;
    },
    getPoster: function (posterSize, posterPath) {
        'use strict';

        return movieMe.settings.posters_uri + posterSize + "/" + posterPath;
    },
    getAjax: function(options, callback, errorCallback) {
        'use strict';

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open('GET', movieMe.settings.baseURI + options.searchURL, true);
        xmlHttp.timeout = movieMe.settings.timeout;

        xmlHttp.ontimeout = function() {
            errorCallback('{"status_code":408,"status_message":"Request timed out"}');
        };

        xmlHttp.onload = function(e) {
            if (xmlHttp.readyState === 4 && xmlHttp.status >= 200 && xmlHttp.status <= 400) {

                //Results
                var data = JSON.parse(xmlHttp.responseText);

                var results = data;

                movieMe.search.searchResults(results);            

                //hero load searched movie poster
                var heroId = 'hero';
                var heroWrapper = document.getElementById(heroId);
                var moviePoster = data.results[0].poster_path;
                var posterSrc = movieMe.actions.getPoster("w780", moviePoster);
                heroWrapper.getElementsByTagName('img')[0].src=posterSrc;
                document.querySelector('#hero img').style.marginTop = "-95%";

                //searched movie title
                document.getElementById("searched-title").innerHTML='';
                document.getElementById("searched-title").innerHTML='Liked: '+data.results[0].title+'?<br> You may also like:';
                
                //reset recommendations
                console.log("Clearing posters wrapper");
                document.getElementById("movieposters").innerHTML='';

            }

        };

        xmlHttp.onerror = function(e) {
            errorCallback(xmlHttp.responseText);
        };

        xmlHttp.send();
    },
    printMovieCallback: function(value) {
        'use strict';

        var contentWrapper, content = '';
        contentWrapper = 'movieposters';

        content += '<div class="col-sm-4 col-xs-6 poster img"><div class="card">';
        content += '    <div class="flipwr">';
        content += '        <div class="front">';
        content += '            <figure>';
        content += '                <img src="'+movieMe.actions.getPoster("w500", value.poster_path)+'" alt="'+value.title+'" alt="'+value.title+'" />';
        content += '                <figurecaption>'+value.title+'</figurecaption>';
        content += '            </figure>';
        content += '            </div>';
        content += '        <div class="back hide">';
        content +=              value.overview;
        content += '        </div>';
        content += '    </div>';
        content += '</div></div>';

        // Actualizando el HTML
        document.getElementById(contentWrapper).innerHTML = document.getElementById(contentWrapper).innerHTML+content;
    }
};

//SEARCH & FETCH
movieMe.search = {
    getMovie: function(params, callback, errorCallback) {
        'use strict';

        /*
        //count total fnarguments sending
        console.groupCollapsed("Debug: arguments enviados a getMovie()");
        for (var i=0;i<arguments.length;i++) {
            console.info(arguments[i]);
        }
        console.groupEnd();
        */

        movieMe.actions.argsValidate(arguments, 3);
        movieMe.actions.callbacksValidate([callback, errorCallback]);

        //3 params: @object->options, fn->callback, fn->errorCallback
        movieMe.actions.getAjax(
            {
                searchURL: "search/movie" + movieMe.actions.queryMovie(params) + "&append_to_response=videos"
            },
            callback,
            errorCallback
        );
    },
    searchResults: function (details){
        'use strict';
        //console.log("searchResults ejecutándose");
        //console.log(details);
        var searchedMovieId = details.results[0].id;


        //Fetch results details for searched movie
        for(var result in details) {

            if (details.hasOwnProperty(result)){
                var value = details[result];
                //console.log(details[result]);

                //fetch result details
                for(var prop in value) {

                    if (value.hasOwnProperty(prop)){
                        //console.log(value[prop]);
                        var movieData = value[prop];

                        console.groupCollapsed("Matched search movie(s): ", movieData.title);
                        console.log("id: "+movieData.id);
                        console.log("Título: "+movieData.title);
                        console.log("Sinopsis: "+movieData.overview);
                        console.log("Cartel: "+movieMe.actions.getPoster("w780", movieData.poster_path));
                        console.log("Fecha estreno: "+movieData.release_date);
                        console.groupEnd();

                    }

                }
                
            }
        }

        //fetch movie id from current searched movie to be used to suggest related movies
        movieMe.search.relatedMovies(
            details.results[0].id,
            function(details) {
                console.log("passing data to related movies...");
            },
            function(details) {
                console.log('error: '+error);
            }
        );        
        
    },
    relatedMovies: function(details, callback, errorCallback) {
        'use strict';

        var movieId = details;
        console.log("movieId: "+movieId);

        movieMe.actions.argsValidate(arguments, 3);
        movieMe.actions.callbacksValidate([callback, errorCallback]);

        console.info("searching related movies...");

        var xmlHttp = new XMLHttpRequest();
        var url = movieMe.settings.baseURI+"movie/"+movieId+"/similar_movies?api_key="+ movieMe.settings.apiKey+"&language=es";
        xmlHttp.open('GET', url, true);
       
        xmlHttp.ontimeout = function() {
            errorCallback('{"status_code":408,"status_message":"Request timed out"}');
        };


        xmlHttp.onload = function(e) {
            if (xmlHttp.readyState === 4 && xmlHttp.status >= 200 && xmlHttp.status <= 400) {

                //Results
                var data = JSON.parse(xmlHttp.responseText);
                console.log(data);

                var results = data;
                for(var result in results) {

                    //fetch results
                    if (results.hasOwnProperty(result)){
                        var value = results[result];
                        //console.log(results[result]);

                        //fetch result details
                        for(var prop in value) {

                            if (value.hasOwnProperty(prop)){

                                var movieData = value[prop];

                                //console.log(movieData);
                                console.groupCollapsed("Related Movie(s): ", movieData.title);
                                console.log("id: "+movieData.id);
                                console.log("título: "+movieData.title);
                                console.log("sinopsis: "+movieData.overview);
                                console.log("poster: "+movieMe.actions.getPoster("w780", movieData.poster_path));
                                console.log("Fecha estreno: "+movieData.release_date);
                                console.groupEnd();

                                movieMe.actions.printMovieCallback(movieData);                                 
                            }

                        }
                    }
                }
                console.info("finished searching related movies.");

            }

        };

        xmlHttp.onerror = function(e) {
            errorCallback(xmlHttp.responseText);
        };

        xmlHttp.send();
    }

}; 
