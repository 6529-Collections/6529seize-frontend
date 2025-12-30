  | test             			| Jest in silent mode                 				| Documented, manual use    | NO - core testing            |
  | test:e2e         		    | Playwright E2E tests                				| Documented             	| Keep                         |
  | test:e2e:ui      		    | Playwright with UI                  				| Not referenced         	| Keep - useful for debugging  |
  | test-json                 	| References test-results/list-failed-tests.cjs which doesn't exist 			| REMOVE (broken)              |
  | test-json-changed   	    | Same issue - references missing file             								| REMOVE (broken)              |
 
  | lint         			    | ESLint (full output)            					| Documented, manual use  	| NO                           |
  | lint:quiet   			    | ESLint without warnings         				    | Called by build         	| NO                           |
  | lint:changed 		        | Lint only changed files vs main 			        | Not referenced directly 	| Keep - useful for PRs        |
  | lint:fix     			    | ESLint with auto-fix            				    | Documented              	| NO - commonly used           |
  | knip             		    | Knip with fix + allow-remove-files 			    | Documented         		| Keep                         |
  | deadcode         		    | Runs all 3 deadcode scripts        			    | Not referenced     		| Keep (aggregator)            |
  | deadcode:knip    	        | Just knip (no flags)               				| Called by deadcode 		| Keep                         |
  | deadcode:exports 	        | ts-prune for unused exports        			    | Called by deadcode 		| Keep                         |
  | deadcode:deps    	        | depcheck for unused dependencies   		        | Called by deadcode 		| Keep                         |
