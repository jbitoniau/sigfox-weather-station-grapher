'use strict';

/*
	HttpRequest
*/
function HttpRequest()
{
}

HttpRequest.request = function( url, method, data, headers )
{
	var promise = new Promise(
		function(resolve, reject) 
		{
			var request = new XMLHttpRequest();
			request.open( method, url );
			if ( headers )
			{
				for ( var header in headers )
				{
					if ( headers.hasOwnProperty(header) )
					{
						request.setRequestHeader(header, headers[header]);
					}
				}
			}

			request.onload = function( event ) 	 
				{
					if ( request.status===200 )
					{
						resolve( request.response );
					}
					else
					{
						reject( new Error(request.status ) );
					}
				};

			request.onerror = function( event )		
				{
					reject( new Error(request.status ) );
				};
	
			try
			{
				request.send(data);
			}
			catch (exception)
			{
				reject( exception );
			}
		});
	return promise;
};